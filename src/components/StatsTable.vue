<script setup lang="ts">
import { formatHalfStep } from '@/utils/number'
import ExtendedPianoBox from '@/components/stats/ExtendedPianoBox.vue'

const props = defineProps<{
  investors: number
  adLevel: number
  audience: number
  capacity: number
  equipment: number
  ticketIncomePerPerson: number
  clickPower: number
  audienceStaySeconds: number
  investorIncome: number
  investorIncomeIntervalSeconds: number
  audienceIncome: number
  audienceIncomeIntervalSeconds: number
  prestigeMultiplier: number
  extendedPianoEnabled: boolean
  extendedPianoUnlocked: boolean
  totalUpgradeCount: number
}>()

defineEmits(['toggle-extended-piano', 'show-keyboard-help'])
</script>

<template>
  <aside class="stats glow-stats">
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
          <td>Výdělek za 1 lístek</td>
          <td>{{ formatHalfStep(ticketIncomePerPerson) }}$</td>
        </tr>
        <tr>
          <td>Výdělek za 1 klik</td>
          <td>{{ formatHalfStep(clickPower) }}$</td>
        </tr>
        <tr>
          <td>Prestižní bonus</td>
          <td>x{{ formatHalfStep(prestigeMultiplier) }}</td>
        </tr>
        <tr>
          <td>Publikum zůstává</td>
          <td>{{ formatHalfStep(audienceStaySeconds) }}s</td>
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

    <ExtendedPianoBox
      :investors="investors"
      :total-upgrade-count="totalUpgradeCount"
      :capacity="capacity"
      :extended-piano-enabled="extendedPianoEnabled"
      :extended-piano-unlocked="extendedPianoUnlocked"
      @toggle-extended-piano="$emit('toggle-extended-piano')"
      @show-keyboard-help="$emit('show-keyboard-help')"
    />
  </aside>
</template>

<style scoped>
.glow-stats {
  background: rgba(30, 24, 38, 0.96);
  box-shadow:
    inset 0 0 30px rgba(255, 77, 109, 0.08),
    0 18px 34px rgba(0, 0, 0, 0.22);
}

.glow-stats h2 {
  color: #ffd5df;
  text-shadow: 0 0 14px rgba(255, 77, 109, 0.18);
}

.glow-stats table {
  overflow: hidden;
  border-radius: 10px;
}

.glow-stats th {
  background: rgba(73, 41, 63, 0.95);
}

.glow-stats tr:nth-child(odd) {
  background: rgba(57, 38, 56, 0.82);
}

.glow-stats tr:nth-child(even) {
  background: rgba(49, 34, 49, 0.82);
}

.glow-stats td {
  color: rgba(255, 255, 255, 0.9);
}

.glow-stats td:last-child {
  color: #ff9bb0;
  font-weight: 700;
}

</style>
