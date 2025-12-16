package models

import "time"

type JobStatus string

const (
	StatusPending   JobStatus = "pending"
	StatusRunning   JobStatus = "running"
	StatusCompleted JobStatus = "completed"
	StatusFailed    JobStatus = "failed"
)

type Job struct {
	ID        string    `json:"job_id"`
	Status    JobStatus `json:"status"`
	Progress  int       `json:"progress,omitempty"`
	Message   string    `json:"message,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Results   *JobResults `json:"results,omitempty"`
}

type JobResults struct {
	BestModel struct {
		Name             string            `json:"name"`
		Hyperparameters  map[string]interface{} `json:"hyperparameters"`
		SelectedFeatures []string          `json:"selected_features"`
	} `json:"best_model"`
	Metrics struct {
		TrainScore      float64 `json:"train_score"`
		ValidationScore float64 `json:"validation_score"`
		TestScore       *float64 `json:"test_score,omitempty"`
	} `json:"metrics"`
	FeatureImportance map[string]float64 `json:"feature_importance"`
	TrainingHistory   []TrainingHistoryEntry `json:"training_history,omitempty"`
}

type TrainingHistoryEntry struct {
	Iteration int                    `json:"iteration"`
	Score     float64                `json:"score"`
	Config    map[string]interface{} `json:"config"`
}

