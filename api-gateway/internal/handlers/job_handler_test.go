package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"quantum-automl/api-gateway/internal/client"
	"quantum-automl/api-gateway/internal/queue"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	return r
}

func TestGetJobStatus(t *testing.T) {
	// Setup
	jobQueue := queue.NewJobQueue()
	automlClient := client.NewAutoMLClient("http://localhost:8000")
	handler := NewJobHandler(jobQueue, automlClient)
	
	// Create a test job
	jobID := "test-job-123"
	jobQueue.CreateJob(jobID)
	
	// Setup router
	r := setupTestRouter()
	r.GET("/status/:job_id", handler.GetJobStatus)
	
	// Make request
	req, _ := http.NewRequest("GET", "/status/"+jobID, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	// Assert
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, jobID, response["job_id"])
	assert.Equal(t, "pending", response["status"])
}

func TestGetJobStatusNotFound(t *testing.T) {
	// Setup
	jobQueue := queue.NewJobQueue()
	automlClient := client.NewAutoMLClient("http://localhost:8000")
	handler := NewJobHandler(jobQueue, automlClient)
	
	// Setup router
	r := setupTestRouter()
	r.GET("/status/:job_id", handler.GetJobStatus)
	
	// Make request
	req, _ := http.NewRequest("GET", "/status/nonexistent", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	
	// Assert
	assert.Equal(t, http.StatusNotFound, w.Code)
}

