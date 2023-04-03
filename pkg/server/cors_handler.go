package server

import "net/http"

func addCORSHeaders(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, DELETE, PATCH, PUT")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		requestedHeaders := r.Header.Get("Access-Control-Request-Headers")
		if requestedHeaders != "" {
			w.Header().Set("Access-Control-Allow-Headers", requestedHeaders)
		}

		// If this is a preflight request just return 200 OK without any further
		// processing.
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		handler(w, r)
	}
}
