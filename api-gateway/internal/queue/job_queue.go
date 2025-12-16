package queue

import (
	"sync"
	"time"

	"quantum-automl/api-gateway/internal/models"
)

type JobQueue struct {
	jobs map[string]*models.Job
	mu   sync.RWMutex
}

func NewJobQueue() *JobQueue {
	return &JobQueue{
		jobs: make(map[string]*models.Job),
	}
}

func (q *JobQueue) CreateJob(jobID string) *models.Job {
	q.mu.Lock()
	defer q.mu.Unlock()

	job := &models.Job{
		ID:        jobID,
		Status:    models.StatusPending,
		Progress:  0,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	q.jobs[jobID] = job
	return job
}

func (q *JobQueue) GetJob(jobID string) (*models.Job, bool) {
	q.mu.RLock()
	defer q.mu.RUnlock()

	job, exists := q.jobs[jobID]
	return job, exists
}

func (q *JobQueue) UpdateJobStatus(jobID string, status models.JobStatus, progress int, message string) bool {
	q.mu.Lock()
	defer q.mu.Unlock()

	job, exists := q.jobs[jobID]
	if !exists {
		return false
	}

	job.Status = status
	job.Progress = progress
	job.Message = message
	job.UpdatedAt = time.Now()

	return true
}

func (q *JobQueue) SetJobResults(jobID string, results *models.JobResults) bool {
	q.mu.Lock()
	defer q.mu.Unlock()

	job, exists := q.jobs[jobID]
	if !exists {
		return false
	}

	job.Results = results
	job.Status = models.StatusCompleted
	job.Progress = 100
	job.UpdatedAt = time.Now()

	return true
}

func (q *JobQueue) SetJobFailed(jobID string, message string) bool {
	q.mu.Lock()
	defer q.mu.Unlock()

	job, exists := q.jobs[jobID]
	if !exists {
		return false
	}

	job.Status = models.StatusFailed
	job.Message = message
	job.UpdatedAt = time.Now()

	return true
}

