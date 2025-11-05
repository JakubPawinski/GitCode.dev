import axios from 'axios'

const baseURL = process.env.BACKEND_URL
const timeout = 1000
console.log(baseURL)
export const api = axios.create({
  baseURL: baseURL,
  timeout: timeout,
})
