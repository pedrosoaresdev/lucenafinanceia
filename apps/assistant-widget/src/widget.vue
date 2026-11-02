<script setup lang="ts">
import { ref } from 'vue';
const question = ref('');
const answer = ref('');
const busy = ref(false);
async function ask() {
  if (!question.value.trim() || busy.value) return;
  busy.value = true;
  answer.value = 'Para responder com segurança, o assistente precisa de uma sessão autenticada e acesso autorizado aos seus dados. Essa conexão ainda não está habilitada.';
  question.value = '';
  busy.value = false;
}
</script>

<template>
  <main class="assistant">
    <header><span class="star">✦</span><div><b>Lucena Insights</b><small>Seu assistente financeiro</small></div><span class="badge">PRÉVIA</span></header>
    <section><div class="hello"><span class="star large">✦</span><h1>Vamos conversar<br>sobre suas finanças?</h1><p>As respostas usam apenas dados financeiros aos quais você autorizou acesso.</p></div><div v-if="answer" class="answer" role="status">{{ answer }}</div></section>
    <form @submit.prevent="ask"><input v-model="question" aria-label="Sua pergunta" placeholder="Ex.: quanto gastei este mês?" maxlength="500"><button :disabled="busy || !question.trim()" aria-label="Enviar pergunta">↑</button></form>
    <footer>Respostas financeiras informativas. Estimativas serão identificadas como projeções.</footer>
  </main>
</template>
