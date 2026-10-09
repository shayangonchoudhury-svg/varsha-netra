/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { TopNav } from './components/TopNav';
import { LivingEnvironmentBackdrop } from './components/LivingEnvironmentBackdrop';
import { RainOverview } from './components/RainOverview';
import { InteractiveCampusMap } from './components/InteractiveCampusMap';
import { ZoneDetailView } from './components/ZoneDetailView';
import { ScenarioLab } from './components/ScenarioLab';
import { ActionPlanView } from './components/ActionPlanView';
import { ImpactComparisonView } from './components/ImpactComparisonView';
import { HydrologicalFormulasModal } from './components/HydrologicalFormulasModal';
import { hydrologyService } from './services/simulationService';
import { ScenarioParams } from './types/hydrology';
import { WeatherDerivedStormProfile } from './types/weather';
import { PRESET_RAIN_SCENARIOS } from './data/kiitCampusData';

export type ScenarioSource = 'LIVE_WEATHER' | 'DEMO_PRESET' | 'CUSTOM';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('z-gate');

  // Single Authoritative State Machine
  const [scenarioSource, setScenarioSource] = useState<ScenarioSource>('DEMO_PRESET');
  const [activePresetId, setActivePresetId] = useState<string>('baseline-heavy');
  const [activeLiveProfile, setActiveLiveProfile] = useState<WeatherDerivedStormProfile | null>(null);
  const [isFormulasOpen, setIsFormulasOpen] = useState<boolean>(false);
  const [showRainAnimation, setShowRainAnimation] = useState<boolean>(true);

  // Authoritative Scenario Parameters (Single Source of Truth)
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>(() =>
    hydrologyService.getDefaultScenarioParams()
  );

  const zones = useMemo(() => hydrologyService.getCampusZones(), []);
  const rainEvent = useMemo(() => hydrologyService.getBaselineEvent(), []);

  // Compute Authoritative Active Scenario Label
  const scenarioLabel = useMemo(() => {
    if (scenarioSource === 'LIVE_WEATHER' && activeLiveProfile) {
      return activeLiveProfile.label;
    }
    if (scenarioSource === 'DEMO_PRESET') {
      const found = PRESET_RAIN_SCENARIOS.find((p) => p.id === activePresetId);
      return found ? found.name : `${scenarioParams.rainfallMm} mm Storm Scenario`;
    }
    return `Custom Simulation (${scenarioParams.rainfallMm} mm · ${scenarioParams.durationHours}h)`;
  }, [scenarioSource, activeLiveProfile, activePresetId, scenarioParams.rainfallMm, scenarioParams.durationHours]);

  // Baseline & simulated results calculated deterministically from active scenarioParams
  const baselineSimulation = useMemo(
    () =>
      hydrologyService.getBaselineSimulation(
        scenarioParams.rainfallMm,
        scenarioParams.durationHours,
        scenarioParams.stormProfile
      ),
    [scenarioParams.rainfallMm, scenarioParams.durationHours, scenarioParams.stormProfile]
  );

  const currentSimulation = useMemo(
    () => hydrologyService.simulateScenario(scenarioParams, scenarioLabel),
    [scenarioParams, scenarioLabel]
  );

  const comparison = useMemo(
    () => hydrologyService.compareWithBaseline(scenarioParams, scenarioLabel),
    [scenarioParams, scenarioLabel]
  );

  const actionItems = useMemo(
    () => hydrologyService.getActionPlanForSimulation(currentSimulation),
    [currentSimulation]
  );

  const selectedZoneDetail = useMemo(
    () => hydrologyService.getSingleZoneDetail(selectedZoneId, scenarioParams),
    [selectedZoneId, scenarioParams]
  );

  // Preset Selection Action
  const handleSelectPreset = (presetId: string) => {
    setActivePresetId(presetId);
    setScenarioSource('DEMO_PRESET');
    setActiveLiveProfile(null);
    const presets = hydrologyService.getPresetScenarios();
    const found = presets.find((p) => p.id === presetId);
    if (found) {
      setScenarioParams((prev) => ({
        ...prev,
        rainfallMm: found.rainfallMm,
        durationHours: found.durationHours,
        stormProfile: found.stormProfile,
      }));
    }
  };

  // Live Weather Model Selection Action
  const handleModelLiveRain = (profile: WeatherDerivedStormProfile) => {
    setActivePresetId('live-weather');
    setScenarioSource('LIVE_WEATHER');
    setActiveLiveProfile(profile);
    setScenarioParams((prev) => ({
      ...prev,
      rainfallMm: profile.rainfallMm,
      durationHours: profile.durationHours,
      stormProfile: profile.stormProfile,
    }));
  };

  // Custom Simulator Parameters Adjustment Action
  const handleUpdateCustomParams = (newParams: ScenarioParams) => {
    setScenarioSource('CUSTOM');
    setActivePresetId('custom');
    setScenarioParams(newParams);
  };

  // Reset to Baseline Action
  const handleResetToBaseline = () => {
    setActivePresetId('baseline-heavy');
    setScenarioSource('DEMO_PRESET');
    setActiveLiveProfile(null);
    setScenarioParams(hydrologyService.getDefaultScenarioParams());
  };

  const handleNavigate = (tab: string, zoneId?: string) => {
    if (zoneId) {
      setSelectedZoneId(zoneId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#071316] text-[#F4FAFA] flex flex-col selection:bg-[#49D7D0]/30 selection:text-[#8DEBE3] relative">

      {/* 1. ATMOSPHERIC LIVING ENVIRONMENT LAYER */}
      <LivingEnvironmentBackdrop
        rainfallMm={scenarioParams.rainfallMm}
        showRainAnimation={showRainAnimation}
      />

      {/* 2. TOP BAR CONTRACT NAVIGATION */}
      <TopNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenFormulas={() => setIsFormulasOpen(true)}
        onQuickSimulate={() => {
          setCurrentTab('scenario');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        rainfallMm={scenarioParams.rainfallMm}
        scenarioSource={scenarioSource}
        scenarioLabel={scenarioLabel}
      />

      {/* 3. MAIN WORKSPACE VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 relative z-10">

        {currentTab === 'overview' && (
          <RainOverview
            rainEvent={rainEvent}
            simulation={currentSimulation}
            baselineSimulation={baselineSimulation}
            comparison={comparison}
            actionItems={actionItems}
            scenarioParams={scenarioParams}
            scenarioSource={scenarioSource}
            scenarioLabel={scenarioLabel}
            onNavigate={handleNavigate}
            onSelectPreset={handleSelectPreset}
            onOpenFormulas={() => setIsFormulasOpen(true)}
            onModelRain={handleModelLiveRain}
            activePresetId={activePresetId}
            activeLiveProfile={activeLiveProfile}
          />
        )}

        {currentTab === 'map' && (
          <InteractiveCampusMap
            zones={zones}
            simulation={currentSimulation}
            selectedZoneId={selectedZoneId}
            scenarioSource={scenarioSource}
            scenarioLabel={scenarioLabel}
            onSelectZone={(id) => setSelectedZoneId(id)}
            onOpenZoneDetail={(id) => {
              setSelectedZoneId(id);
              setCurrentTab('zone-detail');
            }}
            onNavigateToActions={() => {
              setCurrentTab('actions');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToImpact={() => {
              setCurrentTab('impact');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToScenario={() => {
              setCurrentTab('scenario');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'zone-detail' && selectedZoneDetail && (
          <ZoneDetailView
            zone={selectedZoneDetail.zone}
            analysis={selectedZoneDetail.analysis}
            params={scenarioParams}
            onBackToMap={() => setCurrentTab('map')}
            onNavigateToScenario={() => setCurrentTab('scenario')}
            onSelectZone={(id) => setSelectedZoneId(id)}
            allZones={zones}
          />
        )}

        {currentTab === 'scenario' && (
          <ScenarioLab
            zones={zones}
            baselineSimulation={baselineSimulation}
            currentSimulation={currentSimulation}
            comparison={comparison}
            params={scenarioParams}
            scenarioSource={scenarioSource}
            scenarioLabel={scenarioLabel}
            onUpdateParams={handleUpdateCustomParams}
            onSimulate={handleUpdateCustomParams}
            onResetToBaseline={handleResetToBaseline}
            onOpenFormulas={() => setIsFormulasOpen(true)}
            onNavigateToActions={() => setCurrentTab('actions')}
            onNavigateToImpact={() => setCurrentTab('impact')}
          />
        )}

        {currentTab === 'actions' && (
          <ActionPlanView
            actions={actionItems}
            simulation={currentSimulation}
            onNavigateToZone={(zoneId: string) => {
              setSelectedZoneId(zoneId);
              setCurrentTab('map');
            }}
            onNavigateToScenario={() => setCurrentTab('scenario')}
          />
        )}

        {currentTab === 'impact' && (
          <ImpactComparisonView
            comparison={comparison}
            onNavigateToScenario={() => setCurrentTab('scenario')}
            onNavigateToActions={() => setCurrentTab('actions')}
          />
        )}

      </main>

      {/* 4. MODAL: MATHEMATICAL CONTRACT & EQUATION VIEWER */}
      <HydrologicalFormulasModal
        isOpen={isFormulasOpen}
        onClose={() => setIsFormulasOpen(false)}
      />

    </div>
  );
}
