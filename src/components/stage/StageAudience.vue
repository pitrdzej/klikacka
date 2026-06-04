<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  capacity: number
  displayAudience: Array<{ active: boolean; hue: number }>
  audienceOverflow: number
}>()

const visibleAudienceCount = computed(() => props.displayAudience.filter((member) => member.active).length)
</script>

<template>
  <section class="publikum">
    <h3><i class="fa-solid fa-users"></i> Publikum</h3>

    <div class="audience-container">
      <div
        v-for="(member, index) in displayAudience"
        :key="index"
        class="audience-member"
        :class="{ active: member.active }"
        :style="member.active ? { '--audience-hue': `${member.hue}`, '--audience-color': `hsl(${member.hue} 85% 62%)` } : undefined"
      ></div>
    </div>

    <p class="audience-stats">
      {{ visibleAudienceCount }}{{ audienceOverflow > 0 ? ' + ' + audienceOverflow : '' }} / {{ capacity }}
    </p>
  </section>
</template>

<style scoped>
.audience-member.active {
  background: radial-gradient(circle at 30% 30%, hsl(var(--audience-hue, 0) 90% 72%), hsl(var(--audience-hue, 0) 85% 58%));
  box-shadow: 0 0 10px var(--audience-color);
}

.audience-member.active::before {
  background: hsl(var(--audience-hue, 0) 85% 78%);
}

.audience-member.active::after {
  background: hsl(var(--audience-hue, 0) 75% 45%);
}
</style>
