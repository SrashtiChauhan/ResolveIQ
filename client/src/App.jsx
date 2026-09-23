import { useEffect, useState } from "react";
import {
  Bot,
  User,
  Send,
  Loader2,
  LayoutDashboard,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import "./App.css";

const App = () => {
  const [view, setView] = useState("chat");

  // ---------------- CHAT ----------------
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm ResolveIQ. How can I help you with your order or support request?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: "cust_1001",
          ticketId: "TKT-1001",
          message: userMessage,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.response || "I couldn't process your request right now.",
          escalated: data.escalation?.escalate || false,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting to ResolveIQ right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // ---------------- DASHBOARD ----------------
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  const loadTickets = async () => {
    setTicketLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/tickets");
      const data = await response.json();

      if (data.success) {
        setTickets(data.tickets);

        const escalated = data.tickets.find(
          (ticket) => ticket.status === "escalated",
        );

        if (escalated) {
          setSelectedTicket(escalated);
        }
      }
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setTicketLoading(false);
    }
  };

  useEffect(() => {
    if (view === "dashboard") {
      loadTickets();
    }
  }, [view]);

  const escalatedCount = tickets.filter(
    (ticket) => ticket.status === "escalated",
  ).length;

  const highPriorityCount = tickets.filter(
    (ticket) => ticket.priority === "high",
  ).length;

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <Bot size={22} />
          </div>

          <div>
            <h1>ResolveIQ</h1>
            <p>AI Customer Support</p>
          </div>
        </div>

        <div className="top-nav">
          <button
            className={view === "chat" ? "nav-btn active" : "nav-btn"}
            onClick={() => setView("chat")}
          >
            <MessageSquare size={16} />
            Customer Chat
          </button>

          <button
            className={view === "dashboard" ? "nav-btn active" : "nav-btn"}
            onClick={() => setView("dashboard")}
          >
            <LayoutDashboard size={16} />
            Agent Dashboard
          </button>
        </div>
      </header>

      {/* CUSTOMER CHAT */}
      {view === "chat" && (
        <main className="chat-container">
          <div className="chat-card">
            <div className="chat-header">
              <div>
                <h2>How can we help?</h2>
                <p>Describe your issue and ResolveIQ will investigate it.</p>
              </div>
            </div>

            <div className="messages">
              {messages.map((item, index) => (
                <div key={index} className={`message-row ${item.role}`}>
                  <div className="avatar">
                    {item.role === "assistant" ? (
                      <Bot size={18} />
                    ) : (
                      <User size={18} />
                    )}
                  </div>

                  <div className="message-content">
                    <div className="message-bubble">{item.content}</div>

                    {item.escalated && (
                      <div className="escalation-badge">
                        <AlertTriangle size={13} />
                        Case escalated for further assistance
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message-row assistant">
                  <div className="avatar">
                    <Bot size={18} />
                  </div>

                  <div className="message-content">
                    <div className="investigating">
                      <Loader2 size={16} className="spin" />
                      Investigating your request...
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="input-area">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your support request..."
                rows={1}
                disabled={loading}
              />

              <button
                onClick={sendMessage}
                disabled={!message.trim() || loading}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>

            <p className="input-hint">Press Enter to send</p>
          </div>
        </main>
      )}

      {/* AGENT DASHBOARD */}
      {view === "dashboard" && (
        <main className="dashboard">
          <div className="dashboard-title">
            <div>
              <h2>Agent Dashboard</h2>
              <p>Review escalated customer investigations and support cases.</p>
            </div>

            <button className="refresh-btn" onClick={loadTickets}>
              Refresh
            </button>
          </div>

          {/* SUMMARY */}
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">
                <AlertTriangle size={18} />
              </div>

              <div>
                <span>Escalated</span>
                <strong>{escalatedCount}</strong>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                <Clock size={18} />
              </div>

              <div>
                <span>High Priority</span>
                <strong>{highPriorityCount}</strong>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <span>Total Tickets</span>
                <strong>{tickets.length}</strong>
              </div>
            </div>
          </div>

          {ticketLoading ? (
            <div className="dashboard-loading">
              <Loader2 size={20} className="spin" />
              Loading tickets...
            </div>
          ) : (
            <div className="dashboard-layout">
              {/* TICKET LIST */}
              <section className="ticket-panel">
                <div className="panel-header">
                  <h3>Support Tickets</h3>
                  <span>{tickets.length} tickets</span>
                </div>

                <div className="ticket-list">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.ticketId}
                      className={
                        selectedTicket?.ticketId === ticket.ticketId
                          ? "ticket-item selected"
                          : "ticket-item"
                      }
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="ticket-top">
                        <strong>{ticket.ticketId}</strong>

                        <span className={`priority ${ticket.priority}`}>
                          {ticket.priority}
                        </span>
                      </div>

                      <div className="ticket-subject">{ticket.subject}</div>

                      <div className="ticket-bottom">
                        <span>{ticket.customerId}</span>

                        <span className={`status ${ticket.status}`}>
                          {ticket.status}
                        </span>

                        <ChevronRight size={15} />
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* TICKET DETAIL */}
              <section className="detail-panel">
                {selectedTicket ? (
                  <>
                    {selectedTicket.status === "escalated" && (
                      <div className="escalation-banner">
                        <AlertTriangle size={19} />

                        <div>
                          <strong>High Priority Escalation</strong>
                          <p>This case requires human support attention.</p>
                        </div>
                      </div>
                    )}

                    <div className="detail-header">
                      <div>
                        <span className="detail-label">Ticket</span>

                        <h2>{selectedTicket.ticketId}</h2>

                        <p>{selectedTicket.subject}</p>
                      </div>

                      <span className={`status large ${selectedTicket.status}`}>
                        {selectedTicket.status}
                      </span>
                    </div>

                    <div className="detail-section">
                      <h3>Customer Request</h3>

                      <div className="request-box">
                        {selectedTicket.message}
                      </div>
                    </div>

                    <div className="detail-section">
                      <h3>Investigation</h3>

                      <div className="timeline">
                        <div className="timeline-item">
                          <CheckCircle2 size={17} />
                          <div>
                            <strong>Customer identified</strong>
                            <span>{selectedTicket.customerId}</span>
                          </div>
                        </div>

                        <div className="timeline-item">
                          <CheckCircle2 size={17} />
                          <div>
                            <strong>Support request classified</strong>
                            <span>
                              {selectedTicket.intent || "Support request"}
                            </span>
                          </div>
                        </div>

                        <div className="timeline-item">
                          <CheckCircle2 size={17} />
                          <div>
                            <strong>Previous tickets reviewed</strong>
                            <span>Related support history checked</span>
                          </div>
                        </div>

                        {selectedTicket.notes?.map((note, index) => (
                          <div className="timeline-item" key={index}>
                            <CheckCircle2 size={17} />

                            <div>
                              <strong>Investigation note</strong>
                              <span>{note.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="detail-section">
                      <h3>Resolution / Escalation</h3>

                      <div className="decision-box">
                        <div>
                          <span>Priority</span>
                          <strong>{selectedTicket.priority}</strong>
                        </div>

                        <div>
                          <span>Status</span>
                          <strong>{selectedTicket.status}</strong>
                        </div>

                        <div>
                          <span>Intent</span>
                          <strong>
                            {selectedTicket.intent || "Support request"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="action-row">
                      <button className="secondary-action">Add Note</button>

                      <button
                        className="primary-action"
                        onClick={async () => {
                          if (!selectedTicket) return;

                          try {
                            const response = await fetch(
                              `http://localhost:5000/api/tickets/${selectedTicket.ticketId}`,
                              {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  status: "resolved",
                                  note: "Resolved by support agent.",
                                }),
                              },
                            );

                            const data = await response.json();

                            if (!data.success) {
                              throw new Error(
                                data.message || "Failed to resolve ticket",
                              );
                            }

                            await loadTickets();
                          } catch (error) {
                            console.error("Resolve ticket error:", error);
                            alert("Unable to resolve ticket.");
                          }
                        }}
                      >
                        Resolve Ticket
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="empty-detail">
                    <Bot size={32} />
                    <h3>Select a ticket</h3>
                    <p>Select a support ticket to inspect its investigation.</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      )}
    </div>
  );
};

export default App;
