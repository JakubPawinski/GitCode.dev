import axios from 'axios'

// const baseURL = process.env.BACKEND_URL
export const baseURL = 'http://localhost:8080/api'
const timeout = 10000
export const api = axios.create({
  baseURL: baseURL,
  timeout: timeout,
})
