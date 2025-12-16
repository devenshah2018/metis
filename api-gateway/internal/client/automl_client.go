package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"quantum-automl/api-gateway/internal/models"
)

type AutoMLClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewAutoMLClient(baseURL string) *AutoMLClient {
	return &AutoMLClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type ProcessJobRequest struct {
	JobID       string                 `json:"job_id"`
	Dataset     string                 `json:"dataset"` // Base64 encoded
	DatasetFormat string               `json:"dataset_format"`
	Config      map[string]interface{} `json:"config"`
}

func (c *AutoMLClient) ProcessJob(req ProcessJobRequest) error {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := c.httpClient.Post(
		c.baseURL+"/process",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("unexpected status code %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

type UpdateStatusRequest struct {
	JobID    string       `json:"job_id"`
	Status   models.JobStatus `json:"status"`
	Progress int          `json:"progress"`
	Message  string       `json:"message"`
}

func (c *AutoMLClient) UpdateStatus(req UpdateStatusRequest) error {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := c.httpClient.Post(
		c.baseURL+"/update-status",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("unexpected status code %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

type CompleteJobRequest struct {
	JobID   string              `json:"job_id"`
	Results *models.JobResults `json:"results"`
}

func (c *AutoMLClient) CompleteJob(req CompleteJobRequest) error {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := c.httpClient.Post(
		c.baseURL+"/complete",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("unexpected status code %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

