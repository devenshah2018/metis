package routes

import (
	"quantum-automl/api-gateway/internal/client"
	"quantum-automl/api-gateway/internal/handlers"
	"quantum-automl/api-gateway/internal/middleware"
	"quantum-automl/api-gateway/internal/queue"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(automlCoreURL string) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORS())
	r.Use(middleware.Logger())
	r.Use(middleware.ErrorHandler())
	r.Use(gin.Recovery())

	jobQueue := queue.NewJobQueue()
	automlClient := client.NewAutoMLClient(automlCoreURL)
	jobHandler := handlers.NewJobHandler(jobQueue, automlClient)

	r.GET("/health", handlers.HealthHandler)

	api := r.Group("/")
	{
		api.POST("/submit", jobHandler.SubmitJob)
		api.GET("/status/:job_id", jobHandler.GetJobStatus)
		api.GET("/results/:job_id", jobHandler.GetJobResults)
		
		api.POST("/update-status", jobHandler.UpdateStatus)
		api.POST("/complete", jobHandler.CompleteJob)
	}

	return r
}

