package main

import (
	"log"
	"os"

	"quantum-automl/api-gateway/internal/routes"
)

func main() {
	// Get AutoML Core URL from environment or use default
	automlCoreURL := os.Getenv("AUTOML_CORE_URL")
	if automlCoreURL == "" {
		automlCoreURL = "http://localhost:8000"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := routes.SetupRoutes(automlCoreURL)

	log.Printf("Starting API Gateway on port %s", port)
	log.Printf("AutoML Core URL: %s", automlCoreURL)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

