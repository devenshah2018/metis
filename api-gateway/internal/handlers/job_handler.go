package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"quantum-automl/api-gateway/internal/client"
	"quantum-automl/api-gateway/internal/models"
	"quantum-automl/api-gateway/internal/queue"
)

type JobHandler struct {
	queue      *queue.JobQueue
	automlClient *client.AutoMLClient
}

func NewJobHandler(queue *queue.JobQueue, automlClient *client.AutoMLClient) *JobHandler {
	return &JobHandler{
		queue:        queue,
		automlClient: automlClient,
	}
}

type SubmitRequest struct {
	Dataset      string                 `form:"dataset" binding:"required"`
	DatasetFormat string                `form:"dataset_format" binding:"required"`
	Config       string                 `form:"config" binding:"required"`
}

type SubmitResponse struct {
	JobID string `json:"job_id"`
}

func (h *JobHandler) SubmitJob(c *gin.Context) {
	file, _, err := c.Request.FormFile("dataset")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read dataset file"})
		return
	}
	defer file.Close()

	datasetBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read dataset content"})
		return
	}

	datasetFormat := c.PostForm("dataset_format")
	if datasetFormat != "csv" && datasetFormat != "json" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dataset_format must be 'csv' or 'json'"})
		return
	}

	configStr := c.PostForm("config")
	if configStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "config is required"})
		return
	}

	var config map[string]interface{}
	if err := json.Unmarshal([]byte(configStr), &config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid config JSON"})
		return
	}

	// Validate config
	if _, ok := config["metric"]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "config.metric is required"})
		return
	}
	if _, ok := config["search_budget"]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "config.search_budget is required"})
		return
	}
	if _, ok := config["objective"]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "config.objective is required"})
		return
	}

	// Create job
	jobID := uuid.New().String()
	_ = h.queue.CreateJob(jobID)

	// Encode dataset to base64
	datasetBase64 := base64.StdEncoding.EncodeToString(datasetBytes)

	// Send to AutoML Core asynchronously
	go h.processJobAsync(jobID, datasetBase64, datasetFormat, config)

	c.JSON(http.StatusAccepted, SubmitResponse{
		JobID: jobID,
	})
}

func (h *JobHandler) processJobAsync(jobID string, datasetBase64 string, datasetFormat string, config map[string]interface{}) {
	// Update status to running
	h.queue.UpdateJobStatus(jobID, models.StatusRunning, 0, "Processing job...")

	// Send to AutoML Core
	req := client.ProcessJobRequest{
		JobID:         jobID,
		Dataset:       datasetBase64,
		DatasetFormat: datasetFormat,
		Config:        config,
	}

	if err := h.automlClient.ProcessJob(req); err != nil {
		h.queue.SetJobFailed(jobID, fmt.Sprintf("Failed to process job: %v", err))
		return
	}

	// Note: AutoML Core will call back to update status and complete the job
}

func (h *JobHandler) GetJobStatus(c *gin.Context) {
	jobID := c.Param("job_id")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "job_id is required"})
		return
	}

	job, exists := h.queue.GetJob(jobID)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job_id":  job.ID,
		"status":   job.Status,
		"progress": job.Progress,
		"message":  job.Message,
	})
}

func (h *JobHandler) GetJobResults(c *gin.Context) {
	jobID := c.Param("job_id")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "job_id is required"})
		return
	}

	job, exists := h.queue.GetJob(jobID)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	if job.Status != models.StatusCompleted {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Job is not completed yet"})
		return
	}

	if job.Results == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Results not available"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job_id":            job.ID,
		"status":            job.Status,
		"best_model":        job.Results.BestModel,
		"metrics":           job.Results.Metrics,
		"feature_importance": job.Results.FeatureImportance,
		"training_history":  job.Results.TrainingHistory,
	})
}

// Callback endpoints for AutoML Core to update job status
func (h *JobHandler) UpdateStatus(c *gin.Context) {
	var req struct {
		JobID    string            `json:"job_id" binding:"required"`
		Status   models.JobStatus `json:"status" binding:"required"`
		Progress int              `json:"progress"`
		Message  string           `json:"message"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !h.queue.UpdateJobStatus(req.JobID, req.Status, req.Progress, req.Message) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

func (h *JobHandler) CompleteJob(c *gin.Context) {
	var req struct {
		JobID   string              `json:"job_id" binding:"required"`
		Results *models.JobResults `json:"results" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !h.queue.SetJobResults(req.JobID, req.Results) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "completed"})
}

