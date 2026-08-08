export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif", color: "#222" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1.5rem" }}>Privacy Policy</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>Last updated: August 8, 2026</p>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>1. Introduction</h2>
        <p>Cuely (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the Cuely Digital Queue Management application. This privacy policy explains how we collect, use, and protect your information when you use our services.</p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>2. Information We Collect</h2>
        <ul style={{ paddingLeft: "1.5rem", lineHeight: 1.8 }}>
          <li><strong>Phone Number:</strong> Used for sending queue updates, OTPs, and appointment notifications via WhatsApp.</li>
          <li><strong>Name:</strong> Optional, used to personalize your queue experience.</li>
          <li><strong>Queue &amp; Appointment Data:</strong> Token numbers, wait times, and visit history to provide our service.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>3. How We Use Your Information</h2>
        <ul style={{ paddingLeft: "1.5rem", lineHeight: 1.8 }}>
          <li>Send WhatsApp notifications about your queue status and appointment updates.</li>
          <li>Deliver one-time passwords (OTPs) for secure authentication.</li>
          <li>Improve our queue management and wait time estimation services.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>4. WhatsApp Messaging</h2>
        <p>We use the Meta WhatsApp Business API to send you transactional messages such as queue updates and OTPs. Your phone number is shared with Meta solely for message delivery. We do not use your data for marketing purposes without your explicit consent.</p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>5. Data Retention</h2>
        <p>We retain your data only as long as necessary to provide our services. Queue and visit data may be retained for analytics purposes in anonymized form.</p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>6. Data Security</h2>
        <p>We implement industry-standard security measures to protect your personal information, including encryption in transit and at rest.</p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>7. Your Rights</h2>
        <p>You may request deletion of your data at any time by contacting us. You can also opt out of WhatsApp notifications.</p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>8. Contact Us</h2>
        <p>If you have questions about this privacy policy, contact us at <a href="mailto:hello@cuely.app" style={{ color: "#6366f1" }}>hello@cuely.app</a>.</p>
      </section>
    </div>
  );
}
