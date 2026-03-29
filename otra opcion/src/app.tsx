import { useState } from 'react';
import StatCard from './components/StatCard';
import TemperatureZones from './components/TemperatureZones';
import HumidityGauges from './components/HumidityGauges';
import LightLevels from './components/LightLevels';
import IrrigationStatus from './components/IrrigationStatus';
import PlantGrowthChart from './components/PlantGrowthChart';
import AlertsPanel from './components/AlertsPanel';
import EnvironmentOverview from './components/EnvironmentOverview';
import { dailyStats, alerts } from './data/sampleData';

type Tab = 'overview' | 'temperature' | 'irrigation' | 'growth';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [currentTime] = useState(new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }));

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📋' },
    { key: 'temperature', label: 'Climate', icon: '🌡️' },
    { key: 'irrigation', label: 'Irrigation', icon: '🚿' },
    { key: 'growth', label: 'Growth', icon: '🌱' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-green-200">
                🌿
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">GreenHouse <span className="text-emerald-600">Command Center</span></h1>
                <p className="text-[10px] text-gray-400 -mt-0.5">{currentTime} • All systems monitored</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              {criticalCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-semibold text-red-700">{criticalCount} Critical</span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-amber-700">{warningCount} Warnings</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">Online</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats Row - Always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard
            icon={<span className="text-lg">🌡️</span>}
            label="Avg Temp"
            value={dailyStats.avgTemperature}
            unit="°C"
            trend="↑ 0.3° vs yesterday"
            color="bg-orange-50"
          />
          <StatCard
            icon={<span className="text-lg">💧</span>}
            label="Avg Humidity"
            value={`${dailyStats.avgHumidity}%`}
            trend="Stable"
            color="bg-blue-50"
          />
          <StatCard
            icon={<span className="text-lg">☀️</span>}
            label="Light Hours"
            value={dailyStats.avgLightHours}
            unit="hrs"
            trend="Peak at 2 PM"
            color="bg-yellow-50"
          />
          <StatCard
            icon={<span className="text-lg">🚿</span>}
            label="Water Used"
            value={dailyStats.totalWaterUsage}
            unit="L"
            trend="↓ 12% vs avg"
            color="bg-cyan-50"
          />
          <StatCard
            icon={<span className="text-lg">🌿</span>}
            label="Active Plants"
            value={dailyStats.activePlants}
            trend="12 new this week"
            color="bg-green-50"
          />
          <StatCard
            icon={<span className="text-lg">🍅</span>}
            label="Harvest Ready"
            value={dailyStats.harvestReady}
            trend="↑ 5 since Monday"
            color="bg-red-50"
          />
          <StatCard
            icon={<span className="text-lg">🫧</span>}
            label="CO₂ Level"
            value={dailyStats.co2Level}
            unit="ppm"
            trend="Within range"
            color="bg-emerald-50"
          />
          <StatCard
            icon={<span className="text-lg">⚡</span>}
            label="Energy"
            value={dailyStats.energyUsage}
            unit="kWh"
            trend="↓ 8% vs avg"
            color="bg-purple-50"
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <HumidityGauges />
              </div>
              <div>
                <AlertsPanel />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LightLevels />
              <EnvironmentOverview />
            </div>
          </div>
        )}

        {activeTab === 'temperature' && (
          <div className="space-y-6">
            <TemperatureZones />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <HumidityGauges />
              </div>
              <AlertsPanel />
            </div>
          </div>
        )}

        {activeTab === 'irrigation' && (
          <div className="space-y-6">
            <IrrigationStatus />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LightLevels />
              <AlertsPanel />
            </div>
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="space-y-6">
            <PlantGrowthChart />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnvironmentOverview />
              <AlertsPanel />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-green-100 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">
              GreenHouse Command Center v2.4 • Last sync: 30 seconds ago
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 6 sensors online</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 4 actuators active</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Network stable</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
