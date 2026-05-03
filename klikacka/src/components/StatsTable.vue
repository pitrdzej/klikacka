<script setup lang="ts">
import { formatHalfStep } from '@/utils/number'

defineProps<{
  investors: number
  adLevel: number
  audience: number
  capacity: number
  equipment: number
  ticketPrice: number
  investorIncome: number
  investorIncomeIntervalSeconds: number
  audienceIncome: number
  audienceIncomeIntervalSeconds: number
}>()
</script>

<template>
  <aside class="stats">
    <h2>Přehled</h2>
    <table>
      <tbody>
        <tr>
          <td>Investoři</td>
          <td>{{ investors }}</td>
        </tr>
        <tr>
          <td>Úroveň reklamy</td>
          <td>{{ adLevel }}</td>
        </tr>
        <tr>
          <td>Publikum</td>
          <td>{{ audience }} / {{ capacity }}</td>
        </tr>
        <tr>
          <td>Úroveň vybavení</td>
          <td>{{ equipment }}</td>
        </tr>
        <tr>
          <td>Cena lístku</td>
          <td>{{ formatHalfStep(ticketPrice) }}$</td>
        </tr>
        <tr>
          <td>Příjem od investorů</td>
          <td>{{ formatHalfStep(investorIncome) }}$ / {{ formatHalfStep(investorIncomeIntervalSeconds) }}s</td>
        </tr>
        <tr>
          <td>Příjem od publika</td>
          <td>{{ formatHalfStep(audienceIncome) }}$ / {{ formatHalfStep(audienceIncomeIntervalSeconds) }}s</td>
        </tr>
      </tbody>
    </table>
  </aside>
</template>
