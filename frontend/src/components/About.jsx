import React from 'react';

/**
 * About — Architecture overview page matching Geist Minimalist design.
 */
export default function About() {
  return (
    <div className="main-content">
      <div className="about-page">
        <div className="about-header">
          <h1>LLM Inference Logger:<br/>An Interactive Project Overview</h1>
          <p>
            A production-grade inference logging and ingestion system for LLM applications. 
            This project demonstrates a multi-turn conversational AI chatbot powered by NVIDIA's Llama 3.2, 
            complete with an event-driven ingestion pipeline, automated metadata capture, and real-time dashboard analytics.
          </p>
        </div>

        <div className="about-features">
          <div className="about-feature">
            <div className="about-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"></path><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
            </div>
            <h3>1. Intelligent Chatbot Application</h3>
            <p>
              The NVIDIA Llama 3.2 model to provide fast and streaming responses to its visitors. Supports conversation context and history management.
            </p>
          </div>
          
          <div className="about-feature">
            <div className="about-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            </div>
            <h3>2. Lightweight SDK Wrapper</h3>
            <p>
              Transparent API calls to receive correct API metadata capture and expressions. Intercepts fetch calls to gather real-time performance data automatically.
            </p>
          </div>
          
          <div className="about-feature">
            <div className="about-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
            </div>
            <h3>3. Automated Metadata Capture</h3>
            <p>
              Real-time metrics like latency, token usage, time-to-first-token, database expressions, and digital analytics.
            </p>
          </div>
        </div>

        <div className="about-tech">
          <h3>Built With Cutting-Edge Technology</h3>
          <div className="tech-grid">
            <div className="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path></svg>
              <span>NVIDIA Llama 3.2</span>
            </div>
            <div className="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
              <span>PostgreSQL 16</span>
            </div>
            <div className="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              <span>GitHub</span>
            </div>
            <div className="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
              <span>React 19</span>
            </div>
            <div className="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span>Node.js + Express</span>
            </div>
            <div className="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M10 4v4"></path><path d="M2 8h20"></path><path d="M6 4v4"></path></svg>
              <span>Docker Compose</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
