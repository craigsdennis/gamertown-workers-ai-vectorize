document.addEventListener("DOMContentLoaded", () => {
    loadMessages();
  });
  
  function loadMessages() {
    const chatBox = document.getElementById("chat-box");
    const messages = JSON.parse(localStorage.getItem("messages")) || [];
  
    messages.forEach((message) => {
      const messageElement = document.createElement("div");
      messageElement.classList.add("message", message.role);
      messageElement.textContent = message.content;
      chatBox.appendChild(messageElement);
    });
  
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  
  async function sendMessage() {
    const userInput = document.getElementById("user-input").value;
    if (!userInput) return;
  
    const chatBox = document.getElementById("chat-box");
  
    // Append user message to UI
    const userMessage = document.createElement("div");
    userMessage.classList.add("message", "user");
    userMessage.textContent = userInput;
    chatBox.appendChild(userMessage);
  
    // Save message to localStorage
    saveMessage("user", userInput);
  
    // Clear input
    document.getElementById("user-input").value = "";
  
    // Show progress bar
    const progressBarContainer = document.getElementById("progress-bar-container");
    const progressBar = document.getElementById("progress-bar");
    progressBarContainer.style.display = "block";
  
    // Start progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress >= 100) {
        clearInterval(progressInterval);
      } else {
        progress += 2; // Increase progress
        progressBar.style.width = progress + "%";
      }
    }, 100); // Adjust the speed as needed
  
    // Gather the entire message history
    const messageHistory = JSON.parse(localStorage.getItem("messages")) || [];
  
    // Determine if "Use Vectorize" is selected
    const useVectorize = document.getElementById("use-vectorize").checked;
  
    // Prepare the payload
    const payload = {
      messages: messageHistory,
      useVectorize: useVectorize,
    };
  
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Send messages and useVectorize boolean
      });
  
      // Prepare to append assistant's response as it streams in
      const assistantMessage = document.createElement("div");
      assistantMessage.classList.add("message", "assistant");
      assistantMessage.textContent = "";
      chatBox.appendChild(assistantMessage);
  
      // Handle streaming the response
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("Stream done");
          break;
        }
        assistantMessage.textContent += value; // Append streaming text to the assistant message
      }
  
      // Save the final assistant message to localStorage
      saveMessage("assistant", assistantMessage.textContent);
  
      // Scroll to bottom of chat box
      chatBox.scrollTop = chatBox.scrollHeight;
  
    } catch (error) {
      console.error("Error:", error);
    } finally {
      // Hide progress bar
      progressBarContainer.style.display = "none";
      progressBar.style.width = "0%";
    }
  }
  
  function saveMessage(role, content) {
    const messages = JSON.parse(localStorage.getItem("messages")) || [];
    messages.push({ role, content });
    localStorage.setItem("messages", JSON.stringify(messages));
  }
  
  function clearChat() {
    // Clear messages from localStorage
    localStorage.removeItem("messages");
  
    // Clear the chat box
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";
  }
  
  function closeChat() {
    clearChat();
  
    // Optionally, hide the window after clearing the chat
    const chatWindow = document.querySelector(".window");
    chatWindow.style.display = "none";
  }

  function createPopupWindow(title, message) {
    // Create the window container
    const popupWindow = document.createElement('div');
    popupWindow.classList.add('window');
    popupWindow.style.width = '300px';
    popupWindow.style.position = 'absolute';
    popupWindow.style.top = '50px';
    popupWindow.style.left = '50px';
    popupWindow.style.zIndex = '1000';
    
    // Create the title bar
    const titleBar = document.createElement('div');
    titleBar.classList.add('title-bar');
  
    const titleBarText = document.createElement('div');
    titleBarText.classList.add('title-bar-text');
    titleBarText.textContent = title;
  
    const titleBarControls = document.createElement('div');
    titleBarControls.classList.add('title-bar-controls');
  
    // Create the close button (X)
    const closeButton = document.createElement('button');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', () => {
      document.body.removeChild(popupWindow); // Remove the popup window on close
    });
  
    titleBarControls.appendChild(closeButton);
    titleBar.appendChild(titleBarText);
    titleBar.appendChild(titleBarControls);
  
    // Create the window body with the message
    const windowBody = document.createElement('div');
    windowBody.classList.add('window-body');
  
    // Replace newline characters with <br> to handle multiline messages
    const formattedMessage = message.replace(/\n/g, '<br>');
    windowBody.innerHTML = formattedMessage;
  
    // Append the title bar and window body to the popup window
    popupWindow.appendChild(titleBar);
    popupWindow.appendChild(windowBody);
  
    // Add the popup window to the document body
    document.body.appendChild(popupWindow);
  }