<script setup lang="ts">
import { formatHalfStep } from '@/utils/number'

defineProps<{
  money: number
  floatingTexts: Array<{ id: number; x: number; y: number; amount: number }>
  audience: number
  capacity: number
  displayAudience: boolean[]
  audienceOverflow: number
}>()

const emit = defineEmits<{
  (e: 'sing', event: MouseEvent): void
}>()
</script>

<template>
  <article class="stage-section">
    <section class="money-display">
      <i class="fa-solid fa-dollar-sign"></i>
      <span class="money-value">{{ formatHalfStep(money) }}</span>
    </section>

    <section class="stage">
      <div class="spotlight"></div>
      <div class="click-area" data-action @click="emit('sing', $event)">
        <i class="fa-solid fa-user"></i>
      </div>
      <div
        v-for="text in floatingTexts"
        :key="text.id"
        class="floating-text"
        :style="{ left: text.x + 'px', top: text.y + 'px' }"
      >
        +{{ formatHalfStep(text.amount) }}$
      </div>
    </section>

    <section class="publikum">
      <h3><i class="fa-solid fa-users"></i> Publikum</h3>

      <div class="audience-container">
        <div
          v-for="(active, index) in displayAudience"
          :key="index"
          class="audience-member"
          :class="{ active }"
        ></div>
      </div>

      <p class="audience-stats">
        {{ audienceOverflow > 0 ? audienceOverflow + ' + ' : '' }}{{ Math.min(audience, 50) }} / {{ capacity }}
      </p>
    </section>
  </article>
</template>
