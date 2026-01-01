const API_BASE_URL = "https://q-by-q.vercel.app/api";
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const errorBanner = document.getElementById("errorMessage");
    const submitBtn = loginForm?.querySelector("button[type='submit']");

    if (!loginForm) {
        console.error("Error: Could not find element with ID 'loginForm'");
        return;
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // 1. Reset UI State
        if (errorBanner) {
            errorBanner.style.display = "none";
            errorBanner.classList.remove("auth-error"); // Clean classes
        }
        
        // Update: Target .gate-input instead of .standard-input
        const inputs = document.querySelectorAll(".gate-input");
        inputs.forEach(i => i.classList.remove("input-error"));

        // 2. Visual Loading State
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Signing in...";

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

// ... existing code ...
try {
    // Port changed from 5000 to 5050 to match your server.js
const res = await fetch(`${API_BASE_URL}/auth/login`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
});
// ... rest of code ...

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("token", data.token);
                window.location.href = "dashboard.html"; 
            } else {
                showError(data.msg || "Email or password incorrect");
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            showError("Server connection lost. Please check if the backend is running.");
        } finally {
            // 3. Reset Button State
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

    function showError(message) {
        if (errorBanner) {
            errorBanner.textContent = message;
            errorBanner.style.display = "block";
            errorBanner.classList.add("auth-error"); // Ensure it uses the new styling
        }
        // Update: Target .gate-input
        const inputs = document.querySelectorAll(".gate-input");
        inputs.forEach(i => i.classList.add("input-error"));
    }
});