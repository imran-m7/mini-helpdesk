import { request } from "./client";

export const ticketsApi = {
  list: (params) => request("/api/tickets", { params }),
  get: (id) => request(`/api/tickets/${id}`),
  create: (data) => request("/api/tickets", { method: "POST", body: data }),
  update: (id, data) => request(`/api/tickets/${id}`, { method: "PATCH", body: data }),
  assignToMe: (id) => request(`/api/tickets/${id}/assign`, { method: "POST" }),
  remove: (id) => request(`/api/tickets/${id}`, { method: "DELETE" }),
};