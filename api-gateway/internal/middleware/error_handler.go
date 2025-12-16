package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error:   "Internal Server Error",
				Message: err.Error(),
			})
		}
	}
}

