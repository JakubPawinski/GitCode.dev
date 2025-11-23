import axios from 'axios'

const baseURL = process.env.BACKEND_URL
const timeout = 1000
export const api = axios.create({
  baseURL: baseURL,
  timeout: timeout,
})
