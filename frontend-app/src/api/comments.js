import { request } from "./client";

export const commentsApi = {
  list: (ticketId) => request(`/api/tickets/${ticketId}/comments`),
  create: (ticketId, body) =>
    request(`/api/tickets/${ticketId}/comments`, { method: "POST", body: { body } }), // first body is request option, second body is the text of the comment
};