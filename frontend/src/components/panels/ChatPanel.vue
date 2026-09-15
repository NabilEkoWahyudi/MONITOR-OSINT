<template>
  <div id="chat-panel" :class="{ open: chat.isOpen.value }">
    <div id="chat-header" @click="chat.toggleChat()">
      🔒 SECURE OSINT COMMS
      <span style="font-size:10px;background:rgba(255,255,255,0.2);padding:2px 5px;border-radius:3px;">{{ chat.myId.value }}</span>
    </div>
    <div id="chat-messages">
      <div v-for="(msg, idx) in chat.messages.value" :key="idx" class="chat-msg" :class="[msg.mine ? 'mine' : 'other', { system: msg.system }]">
        <div class="chat-sender">{{ msg.mine ? 'You' : msg.from }} <span style="color:var(--text-muted);font-weight:normal;">{{ msg.time }}</span></div>
        <div class="chat-text">{{ msg.text }}</div>
      </div>
      <div v-if="chat.typingIndicator.value" style="font-size:10px;color:var(--text-muted);font-style:italic;margin-left:5px;">
        {{ chat.typingIndicator.value }}
      </div>
    </div>
    <div id="chat-input-area">
      <input type="text" id="chat-input" v-model="inputText" placeholder="Enter secure message..."
        @keypress.enter="send" @input="chat.sendTyping()">
      <button id="chat-send" @click="send">TX</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  chat: Object,
});

const inputText = ref('');

function send() {
  props.chat.sendMessage(inputText.value);
  inputText.value = '';
}
</script>
