import React, { useState, useEffect } from 'react'; // React library for hooks
import { ArrowLeft, Palette, ChartBar, Layout, CursorClick, ArrowsMerge, Sliders, Check } from '@phosphor-icons/react'; // Navigation and layout phosphor icons

// Import all 45 primitive components from SDKs
import { CustomCard, GlassmorphicCard, PricingPlanCard, KanbanTaskCard, ProfileHeaderCard, FeatureBenefitCard, BillingInvoiceCard, SettingsToggleCard, PushNotificationToast } from '../primitives/CardSDK';
import { BarChart, LineChart, PieChart, AreaChart, DonutChart, MetricFunnel, ScatterPlot, SparklineTicker } from '../primitives/ChartsSDK';
import { BrowserFrame, HeroMetricCard, TopNavbar, AppCanvas, MockWindow, SidebarLayout, DataGridContainer, SplitHeroLayout, TabSwitcherContainer, BreadcrumbHeader, NotificationToaster } from '../primitives/StructuralSDK';
import { Cursor, TextTyper, ProgressRing, SmoothScroll, FocusZoom, ChartAnimate, DragAndDrop, TypingGhostCursor, MarqueeTrack } from '../primitives/MotionSDK';
import { SpringEnter, StaggerContainer, FadeBlur, SlideInOut, CardReveal, PulseScale, AccordionExpand, RotateFlip, GlitchIntro } from '../primitives/TransitionSDK';

interface PrimitivesDemoOverlayProps {
    onClose: () => void; // Callback triggers when clicking the back arrow button
}

type TabType = 'cards' | 'charts' | 'structure' | 'motion' | 'transitions'; // Category types

export const PrimitivesDemoOverlay: React.FC<PrimitivesDemoOverlayProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('cards'); // Active category tab state
    const [selectedComponent, setSelectedComponent] = useState<string>('GlassmorphicCard'); // Active component selection state

    // Configurations panel control values
    const [glowEnabled, setGlowEnabled] = useState(true);
    const [glowColor, setGlowColor] = useState('#8B5CF6'); // Violet-600
    const [glowIntensity, setGlowIntensity] = useState(2);
    const [glowSpread, setGlowSpread] = useState(15);
    
    const [titleText, setTitleText] = useState('Workspace Metrics');
    const [descriptionText, setDescriptionText] = useState('Analyze render pipelines and compile walkthrough sequence logs.');
    const [accentColor, setAccentColor] = useState('#8B5CF6');
    const [bgColor, setBgColor] = useState('#1f2937'); // Gray-800
    const [progressValue, setProgressValue] = useState(0.75); // 75% progress values
    const [rotateX, setRotateX] = useState(12);
    const [rotateY, setRotateY] = useState(-10);
    const [urlText, setUrlText] = useState('https://kinetic.dev');
    const [windowStyle, setWindowStyle] = useState<'mac' | 'windows'>('mac');
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [toggledState, setToggledState] = useState(true);

    // Escape keyboard listeners to go back to dashboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Setup glow settings helper object
    const glowConfig = {
        enabled: glowEnabled,
        color: glowColor,
        intensity: glowIntensity,
        spread: glowSpread,
    };

    // Shared mock datasets for charts
    const mockChartData = [
        { label: 'Mon', value: 12, color: accentColor },
        { label: 'Tue', value: 19, color: accentColor },
        { label: 'Wed', value: 3, color: accentColor },
        { label: 'Thu', value: 5, color: accentColor },
        { label: 'Fri', value: 2, color: accentColor },
        { label: 'Sat', value: 3, color: accentColor },
        { label: 'Sun', value: 15, color: accentColor },
    ];

    const mockPieData = [
        { label: 'Active', value: 40, color: accentColor },
        { label: 'Idle', value: 35, color: '#374151' },
        { label: 'Stopped', value: 25, color: '#ef4444' },
    ];

    // Helper map showing all 45 components per tab category
    const componentsList: Record<TabType, string[]> = {
        cards: [
            'GlassmorphicCard', 'CustomCard', 'PricingPlanCard', 'KanbanTaskCard', 
            'ProfileHeaderCard', 'FeatureBenefitCard', 'BillingInvoiceCard', 
            'SettingsToggleCard', 'PushNotificationToast'
        ],
        charts: [
            'BarChart', 'LineChart', 'PieChart', 'AreaChart', 
            'DonutChart', 'MetricFunnel', 'ScatterPlot', 'SparklineTicker'
        ],
        structure: [
            'BrowserFrame', 'HeroMetricCard', 'TopNavbar', 'AppCanvas', 
            'MockWindow', 'SidebarLayout', 'DataGridContainer', 'SplitHeroLayout', 
            'TabSwitcherContainer', 'BreadcrumbHeader', 'NotificationToaster'
        ],
        motion: [
            'TextTyper', 'ProgressRing', 'Cursor', 'SmoothScroll', 
            'FocusZoom', 'ChartAnimate', 'DragAndDrop', 'TypingGhostCursor', 'MarqueeTrack'
        ],
        transitions: [
            'SpringEnter', 'StaggerContainer', 'FadeBlur', 'SlideInOut', 
            'CardReveal', 'PulseScale', 'AccordionExpand', 'RotateFlip', 'GlitchIntro'
        ]
    };

    // Tab category changes handler resets selection to top item
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSelectedComponent(componentsList[tab][0]);
    };

    // Dynamic renderer mapping selected component items to live previews
    const renderComponentPreview = () => {
        switch (selectedComponent) {
            // ─── CARDS CATEGORY ───
            case 'GlassmorphicCard':
                return (
                    <div className="w-[340px]">
                        <GlassmorphicCard glowConfig={glowConfig} blur={12} saturate={1.4}>
                            <h3 className="text-sm font-bold text-white mb-1">{titleText}</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">{descriptionText}</p>
                        </GlassmorphicCard>
                    </div>
                );
            case 'CustomCard':
                return (
                    <div className="w-[340px]">
                        <CustomCard glowConfig={glowConfig} headerText={titleText} footerText="System Health: Stable" styleConfig={{ backgroundColor: bgColor }}>
                            <p className="text-xs text-gray-300 leading-relaxed">{descriptionText}</p>
                        </CustomCard>
                    </div>
                );
            case 'PricingPlanCard':
                return (
                    <div className="w-[280px]">
                        <PricingPlanCard glowConfig={glowConfig} price="$99" features={['Unlimited projects', 'Export custom layouts']} ctaLabel="Select Plan" />
                    </div>
                );
            case 'KanbanTaskCard':
                return (
                    <div className="w-[320px]">
                        <KanbanTaskCard glowConfig={glowConfig} title={titleText} status="In Progress" priorityLabel="High" />
                    </div>
                );
            case 'ProfileHeaderCard':
                return (
                    <div className="w-[340px]">
                        <ProfileHeaderCard glowConfig={glowConfig} name={titleText} handle="@kinetic_agent" badgeText="Verified" />
                    </div>
                );
            case 'FeatureBenefitCard':
                return (
                    <div className="w-[320px]">
                        <FeatureBenefitCard glowConfig={glowConfig} icon={<Palette size={18} />} header={titleText} description={descriptionText} />
                    </div>
                );
            case 'BillingInvoiceCard':
                return (
                    <div className="w-[345px]">
                        <BillingInvoiceCard glowConfig={glowConfig} description={titleText} amount="$1,450.00" dueDate="Due: July 12" status="pending" />
                    </div>
                );
            case 'SettingsToggleCard':
                return (
                    <div className="w-[340px]">
                        <SettingsToggleCard glowConfig={glowConfig} label={titleText} description={descriptionText} toggled={toggledState} onToggle={setToggledState} />
                    </div>
                );
            case 'PushNotificationToast':
                return (
                    <div className="w-[320px]">
                        <PushNotificationToast glowConfig={glowConfig} icon={<Palette size={16} />} appName="Kinetic Studio" title={titleText} body={descriptionText} time="Just now" />
                    </div>
                );

            // ─── CHARTS CATEGORY ───
            case 'BarChart':
                return (
                    <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-900">
                        <BarChart data={mockChartData} width={340} height={180} showValues={true} glowConfig={glowConfig} frame={progressValue * 30} />
                    </div>
                );
            case 'LineChart':
                return (
                    <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-900">
                        <LineChart data={mockChartData} width={340} height={180} lineColor={accentColor} showGrid={true} showArea={true} glowConfig={glowConfig} frame={progressValue * 30} />
                    </div>
                );
            case 'PieChart':
                return (
                    <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-900">
                        <PieChart data={mockPieData} size={220} glowConfig={glowConfig} frame={progressValue * 30} />
                    </div>
                );
            case 'AreaChart':
                return (
                    <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-900">
                        <AreaChart data={mockChartData} width={340} height={180} lineColor={accentColor} glowConfig={glowConfig} frame={progressValue * 30} />
                    </div>
                );
            case 'DonutChart':
                return (
                    <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-900">
                        <DonutChart data={mockPieData} size={220} innerRadius={70} glowConfig={glowConfig} frame={progressValue * 30} />
                    </div>
                );
            case 'MetricFunnel':
                return (
                    <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-900">
                        <MetricFunnel data={[{ label: 'Visits', value: 100, color: accentColor }, { label: 'Clicks', value: 60, color: accentColor }, { label: 'Conversions', value: 15, color: '#ef4444' }]} width={320} height={180} glowConfig={glowConfig} frame={progressValue * 30} />
                    </div>
                );
            case 'ScatterPlot':
                return (
                    <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-900">
                        <ScatterPlot points={[{ x: 10, y: 20, color: accentColor }, { x: 40, y: 80, color: accentColor }, { x: 80, y: 40, color: '#ef4444' }]} width={320} height={180} glowConfig={glowConfig} frame={progressValue * 30} />
                    </div>
                );
            case 'SparklineTicker':
                return (
                    <div className="p-3 bg-gray-900/40 rounded-lg border border-gray-900 w-[240px] flex items-center justify-between">
                        <span className="text-xs text-gray-400">BTC Ticker</span>
                        <SparklineTicker data={[10, 15, 8, 12, 20, 18, 25]} width={100} height={30} lineColor={accentColor} glowConfig={glowConfig} frame={progressValue * 30} />
                    </div>
                );

            // ─── STRUCTURE LAYOUTS CATEGORY ───
            case 'BrowserFrame':
                return (
                    <div className="w-[450px] h-[250px]">
                        <BrowserFrame glowConfig={glowConfig} url={urlText} windowStyle={windowStyle} rotateX={rotateX} rotateY={rotateY} perspective={800}>
                            <div className="flex items-center justify-center h-full text-xs text-gray-500 bg-gray-950">Viewport Content</div>
                        </BrowserFrame>
                    </div>
                );
            case 'HeroMetricCard':
                return (
                    <div className="w-[300px]">
                        <HeroMetricCard glowConfig={glowConfig} primaryText="84.2%" captionText={titleText} trend="up" />
                    </div>
                );
            case 'TopNavbar':
                return (
                    <div className="w-[450px] bg-gray-950/40 p-2 rounded-lg border border-gray-900">
                        <TopNavbar glowConfig={glowConfig} logo={<div className="h-6 w-6 rounded bg-violet-600" />} brandName="kinetic Studio" />
                    </div>
                );
            case 'AppCanvas':
                return (
                    <div className="w-[340px] h-[200px]">
                        <AppCanvas glowConfig={glowConfig} width={340} height={200} style={{ backgroundColor: bgColor }}>
                            <div className="flex items-center justify-center h-full text-xs text-gray-600">Canvas Bounds</div>
                        </AppCanvas>
                    </div>
                );
            case 'MockWindow':
                return (
                    <div className="w-[340px] h-[200px]">
                        <MockWindow glowConfig={glowConfig} visible={true} width={340} height={200} style={{ backgroundColor: bgColor }} perspective={800} translateZ={0}>
                            <div className="text-xs p-4 text-gray-400">Card Dialog View</div>
                        </MockWindow>
                    </div>
                );
            case 'SidebarLayout':
                return (
                    <div className="w-[440px] h-[200px] border border-gray-900 rounded-lg overflow-hidden bg-gray-950">
                        <SidebarLayout glowConfig={glowConfig} sidebarWidth={120} sidebarContent={<div className="p-3 text-[10px] text-gray-500">Sidebar Items</div>}>
                            <div className="p-4 text-xs text-gray-400">Main Viewport Canvas</div>
                        </SidebarLayout>
                    </div>
                );
            case 'DataGridContainer':
                return (
                    <div className="w-[380px]">
                        <DataGridContainer glowConfig={glowConfig} columns={2} style={{ backgroundColor: bgColor }}>
                            <div className="text-xs p-2 text-gray-500">Grid Contents Cell</div>
                        </DataGridContainer>
                    </div>
                );
            case 'SplitHeroLayout':
                return (
                    <div className="w-[440px] border border-gray-900 rounded-lg p-3 bg-gray-950">
                        <SplitHeroLayout glowConfig={glowConfig} splitRatio={0.5} leftPanel={<div className="p-2 text-xs text-gray-400">Left Column Content</div>} rightPanel={<div className="p-2 text-xs text-gray-500">Right Column Content</div>} />
                    </div>
                );
            case 'TabSwitcherContainer':
                return (
                    <div className="w-[360px]">
                        <TabSwitcherContainer glowConfig={glowConfig} tabs={['Dashboard', 'Analytics', 'Settings']} activeTab={0} />
                    </div>
                );
            case 'BreadcrumbHeader':
                return (
                    <div className="w-[340px] bg-gray-900/40 p-2.5 rounded border border-gray-900">
                        <BreadcrumbHeader glowConfig={glowConfig} pathSequence={['Projects', 'kinetic', 'BasicGenerator']} />
                    </div>
                );
            case 'NotificationToaster':
                return (
                    <div className="w-[320px]">
                        <NotificationToaster glowConfig={glowConfig} position="bottom-right" notifications={[<div key="1" className="text-xs text-gray-300">Compilation task finished.</div>]} />
                    </div>
                );

            // ─── MOTION & FX CATEGORY ───
            case 'TextTyper':
                return (
                    <div className="p-5 bg-gray-900/20 rounded-xl border border-gray-900 max-w-[380px] min-h-[90px] flex items-center">
                        <TextTyper text={titleText} charsPerFrame={speedMultiplier} textColor={accentColor} frame={progressValue * 50} />
                    </div>
                );
            case 'ProgressRing':
                return (
                    <div className="flex flex-col items-center gap-2">
                        <ProgressRing size={90} strokeWidth={8} targetPercentage={progressValue * 100} color={accentColor} frame={progressValue * 30} />
                        <span className="text-xs text-gray-400 font-mono">{Math.round(progressValue * 100)}%</span>
                    </div>
                );
            case 'Cursor':
                return (
                    <div className="relative w-[350px] h-[200px] border border-gray-900 bg-gray-900/20 rounded-xl flex items-center justify-center overflow-hidden">
                        <div className="text-[10px] text-gray-600 select-none">Cursor Tracking</div>
                        <Cursor startX={175} startY={100} cursorColor={accentColor} frame={5} />
                    </div>
                );
            case 'SmoothScroll':
                return (
                    <div className="w-[340px] h-[200px] border border-gray-900 rounded-xl bg-gray-950 overflow-hidden relative">
                        <SmoothScroll scrollDistance={150} duration={40} frame={progressValue * 40}>
                            <div className="h-[500px] p-4 text-xs text-gray-400 space-y-24 bg-gradient-to-b from-gray-950 to-indigo-950/20">
                                <div>Top Section Element</div>
                                <div>Middle Scroll Section Element</div>
                                <div>Bottom Scroll Section Element</div>
                            </div>
                        </SmoothScroll>
                    </div>
                );
            case 'FocusZoom':
                return (
                    <FocusZoom zoomScale={1.2 + 0.3 * progressValue} duration={30} frame={progressValue * 30}>
                        <div className="w-[200px] h-[120px] bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400">Target Focus Card</div>
                    </FocusZoom>
                );
            case 'ChartAnimate':
                return (
                    <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-900">
                        <ChartAnimate duration={30} frame={progressValue * 30}>
                            <BarChart data={mockChartData} width={300} height={150} frame={progressValue * 30} />
                        </ChartAnimate>
                    </div>
                );
            case 'DragAndDrop':
                return (
                    <div className="relative w-[340px] h-[200px] border border-gray-900 bg-gray-950 rounded-xl overflow-hidden flex items-center justify-between px-6">
                        <div className="text-[10px] text-gray-600 select-none">Drag & Drop Viewport</div>
                        <DragAndDrop startX={40} startY={100} endX={250} endY={100} duration={40} frame={progressValue * 40}>
                            <div className="h-10 w-10 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold shadow-[0_0_15px_rgba(99,102,241,0.5)]">Draggable</div>
                        </DragAndDrop>
                    </div>
                );
            case 'TypingGhostCursor':
                return (
                    <div className="p-4 bg-gray-900/20 rounded-xl border border-gray-900 w-[320px]">
                        <TypingGhostCursor isActive={true} frame={progressValue * 30} />
                    </div>
                );
            case 'MarqueeTrack':
                return (
                    <div className="w-[340px] bg-gray-950 py-2 border-y border-gray-900 overflow-hidden">
                        <MarqueeTrack speedMultiplier={2} frame={progressValue * 60}>
                            <div className="flex gap-8 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                <span>kinetic motion engine</span>
                                <span>saas demos SDK</span>
                                <span>vector morph tools</span>
                            </div>
                        </MarqueeTrack>
                    </div>
                );

            // ─── TRANSITIONS CATEGORY ───
            case 'SpringEnter':
                return (
                    <SpringEnter frame={progressValue * 30} stiffness={100} damping={12}>
                        <div className="w-[200px] h-[100px] bg-violet-600 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]">Spring Entry Box</div>
                    </SpringEnter>
                );
            case 'StaggerContainer':
                return (
                    <StaggerContainer staggerDelay={6}>
                        {[1, 2, 3].map(n => (
                            <div key={n} className="w-[200px] h-[36px] bg-gray-900 border border-gray-800 rounded px-3 py-1 flex items-center justify-between text-xs text-gray-400 mb-2">
                                <span>List Item {n}</span>
                                <Check size={12} className="text-emerald-400" />
                            </div>
                        ))}
                    </StaggerContainer>
                );
            case 'FadeBlur':
                return (
                    <FadeBlur frame={progressValue * 30} duration={30} startBlur={10}>
                        <div className="w-[200px] h-[100px] bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-xs text-gray-400">Fade Blur Elements</div>
                    </FadeBlur>
                );
            case 'SlideInOut':
                return (
                    <SlideInOut frame={progressValue * 30} duration={30} direction="right" distance={100}>
                        <div className="w-[200px] h-[100px] bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-xs text-gray-400">Slide Elements</div>
                    </SlideInOut>
                );
            case 'CardReveal':
                return (
                    <CardReveal frame={progressValue * 30} duration={30}>
                        <div className="w-[240px] h-[120px] bg-indigo-950/40 border border-indigo-900 rounded-xl flex items-center justify-center text-xs text-indigo-400">Card Reveal Element</div>
                    </CardReveal>
                );
            case 'PulseScale':
                return (
                    <PulseScale frame={progressValue * 40} cycleFrames={60}>
                        <div className="w-[120px] h-[120px] bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]">Pulse scale</div>
                    </PulseScale>
                );
            case 'AccordionExpand':
                return (
                    <div className="w-[300px] bg-gray-950 p-2.5 rounded-lg border border-gray-900">
                        <AccordionExpand frame={progressValue * 30} duration={30} expanded={progressValue > 0.5}>
                            <div className="bg-gray-900 border border-gray-800 rounded p-3 text-xs text-gray-400 leading-relaxed">
                                This accordion expand content container animates its height dynamically and smoothly interpolates layout changes.
                            </div>
                        </AccordionExpand>
                    </div>
                );
            case 'RotateFlip':
                return (
                    <RotateFlip frame={progressValue * 35} axis="Y">
                        <div className="w-[200px] h-[120px] bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-xs text-gray-400">Rotate Flip element</div>
                    </RotateFlip>
                );
            case 'GlitchIntro':
                return (
                    <GlitchIntro frame={progressValue * 30} duration={30}>
                        <div className="text-2xl font-black text-white italic tracking-wider uppercase">glitch text</div>
                    </GlitchIntro>
                );
            default:
                return null;
        }
    };

    return (
        // Main full-screen dashboard page container
        <div className="w-full h-full flex flex-col bg-gray-950 text-white font-sans overflow-hidden">
            
            {/* Header section with back navigation triggers */}
            <header className="flex items-center justify-between border-b border-gray-900 px-6 py-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-900 hover:border-gray-800 bg-gray-950 text-gray-400 hover:text-white transition-colors"
                        title="Return to previous screen"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h2 className="text-sm font-bold tracking-wide">kinetic Primitives Playground</h2>
                        <p className="text-[10px] text-gray-500">Configurator playground showing all 45 primitives SDK elements</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-600 bg-gray-900 border border-gray-850 px-2 py-0.5 rounded select-none">Press ESC to exit</span>
                </div>
            </header>

            {/* Category tabs selector navigations */}
            <nav className="flex items-center gap-2 border-b border-gray-900 bg-gray-950/50 px-6 py-2">
                {[
                    { id: 'cards', label: 'Cards (9)', icon: <Palette size={14} /> },
                    { id: 'charts', label: 'Charts (8)', icon: <ChartBar size={14} /> },
                    { id: 'structure', label: 'Structure Layouts (11)', icon: <Layout size={14} /> },
                    { id: 'motion', label: 'Motion & FX (9)', icon: <CursorClick size={14} /> },
                    { id: 'transitions', label: 'Transitions (9)', icon: <ArrowsMerge size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as TabType)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            activeTab === tab.id 
                                ? 'bg-violet-600/10 border-violet-500/30 text-violet-400' 
                                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Split viewport workspace columns */}
            <div className="flex flex-1 overflow-hidden min-h-0">
                
                {/* 1. Left Sidebar: Sub-components list */}
                <aside className="w-[200px] border-r border-gray-900 bg-gray-950 p-4 flex flex-col gap-1.5 overflow-y-auto">
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider block mb-2 px-2">Components</span>
                    {componentsList[activeTab].map(comp => (
                        <button
                            key={comp}
                            onClick={() => setSelectedComponent(comp)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                                selectedComponent === comp 
                                    ? 'bg-gray-900 text-white font-medium border border-gray-800' 
                                    : 'text-gray-400 hover:bg-gray-900/40 hover:text-gray-200'
                            }`}
                        >
                            {comp}
                        </button>
                    ))}
                </aside>

                {/* 2. Center Panel: Live Previews Viewports */}
                <main className="flex-1 bg-gray-950/20 flex flex-col items-center justify-center p-12 overflow-auto relative">
                    <div className="absolute top-4 left-6 text-[10px] text-gray-600 select-none">Interactive Viewport Canvas</div>
                    {/* Centered preview element */}
                    <div className="flex items-center justify-center transition-all duration-300 transform scale-110">
                        {renderComponentPreview()}
                    </div>
                </main>

                {/* 3. Right Sidebar: Property configurations controls panel */}
                <aside className="w-[300px] border-l border-gray-900 bg-gray-950 p-5 flex flex-col gap-5 overflow-y-auto">
                    <div className="flex items-center gap-2 border-b border-gray-900 pb-2">
                        <Sliders size={14} className="text-gray-500" />
                        <span className="text-xs font-bold text-gray-400">Properties Config</span>
                    </div>

                    <div className="space-y-4">
                        {/* Glow Filter Settings Block */}
                        <div className="bg-gray-900/20 border border-gray-900 rounded-xl p-3.5 space-y-3.5">
                            <div className="flex items-center justify-between border-b border-gray-900 pb-1.5">
                                <span className="text-[10px] font-bold text-gray-400">Glow Filter Settings</span>
                                <input 
                                    type="checkbox" 
                                    checked={glowEnabled} 
                                    onChange={e => setGlowEnabled(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-gray-800 bg-gray-900 text-purple-600 accent-purple-600 outline-none"
                                />
                            </div>
                            {glowEnabled && (
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[9px] text-gray-500">
                                            <span>Glow Intensity</span>
                                            <span>{glowIntensity}</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="10" 
                                            value={glowIntensity} 
                                            onChange={e => setGlowIntensity(Number(e.target.value))}
                                            className="w-full accent-violet-600 h-1 bg-gray-900 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[9px] text-gray-500">
                                            <span>Glow Spread (px)</span>
                                            <span>{glowSpread}px</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="5" 
                                            max="45" 
                                            value={glowSpread} 
                                            onChange={e => setGlowSpread(Number(e.target.value))}
                                            className="w-full accent-violet-600 h-1 bg-gray-900 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-gray-500">Glow Color</span>
                                        <input 
                                            type="color" 
                                            value={glowColor} 
                                            onChange={e => setGlowColor(e.target.value)}
                                            className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Interactive Text & Data controls card */}
                        <div className="bg-gray-900/20 border border-gray-900 rounded-xl p-3.5 space-y-3.5">
                            <span className="text-[10px] font-bold text-gray-400 block border-b border-gray-900 pb-1.5">Content Controls</span>
                            
                            {/* Primary Accent Color Selector */}
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-gray-500">Primary Accent</span>
                                <input 
                                    type="color" 
                                    value={accentColor} 
                                    onChange={e => setAccentColor(e.target.value)}
                                    className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                                />
                            </div>

                            {/* Render text values inputs depending on active component */}
                            {['GlassmorphicCard', 'CustomCard', 'HeroMetricCard', 'TextTyper', 'ProfileHeaderCard', 'FeatureBenefitCard', 'BillingInvoiceCard', 'SettingsToggleCard', 'PushNotificationToast', 'MockWindow'].includes(selectedComponent) && (
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-500">Title Label</span>
                                        <input 
                                            type="text" 
                                            value={titleText} 
                                            onChange={e => setTitleText(e.target.value)}
                                            className="w-full rounded border border-gray-900 bg-gray-900 px-2 py-1.5 text-xs text-white outline-none"
                                        />
                                    </div>
                                    {['GlassmorphicCard', 'CustomCard', 'FeatureBenefitCard', 'SettingsToggleCard', 'PushNotificationToast'].includes(selectedComponent) && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] text-gray-500">Body Description</span>
                                            <textarea 
                                                value={descriptionText} 
                                                onChange={e => setDescriptionText(e.target.value)}
                                                className="w-full rounded border border-gray-900 bg-gray-900 px-2 py-1.5 text-xs text-white outline-none h-14 resize-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Settings toggle controls state */}
                            {selectedComponent === 'SettingsToggleCard' && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-gray-500">Toggle Switch State</span>
                                    <input 
                                        type="checkbox" 
                                        checked={toggledState} 
                                        onChange={e => setToggledState(e.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-gray-800 bg-gray-900 text-purple-600 accent-purple-600 outline-none"
                                    />
                                </div>
                            )}

                            {/* Card Base Background controls */}
                            {['CustomCard', 'AppCanvas', 'MockWindow', 'DataGridContainer'].includes(selectedComponent) && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-gray-500">Component BG Color</span>
                                    <input 
                                        type="color" 
                                        value={bgColor} 
                                        onChange={e => setBgColor(e.target.value)}
                                        className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                                    />
                                </div>
                            )}

                            {/* Render progress sliders for charts, rings and transitions */}
                            {['BarChart', 'LineChart', 'PieChart', 'AreaChart', 'DonutChart', 'MetricFunnel', 'ScatterPlot', 'SparklineTicker', 'ProgressRing', 'SmoothScroll', 'FocusZoom', 'ChartAnimate', 'DragAndDrop', 'TypingGhostCursor', 'MarqueeTrack', 'SpringEnter', 'FadeBlur', 'SlideInOut', 'CardReveal', 'PulseScale', 'AccordionExpand', 'RotateFlip', 'GlitchIntro'].includes(selectedComponent) && (
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[9px] text-gray-500">
                                        <span>Animation/Data Progress</span>
                                        <span>{Math.round(progressValue * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.05"
                                        value={progressValue} 
                                        onChange={e => setProgressValue(Number(e.target.value))}
                                        className="w-full accent-violet-600 h-1 bg-gray-900 rounded-lg cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* Render browser perspective rotation inputs */}
                            {selectedComponent === 'BrowserFrame' && (
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-500">Browser URL</span>
                                        <input 
                                            type="text" 
                                            value={urlText} 
                                            onChange={e => setUrlText(e.target.value)}
                                            className="w-full rounded border border-gray-900 bg-gray-900 px-2 py-1.5 text-xs text-white outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-gray-500">Window Style</span>
                                        <select 
                                            value={windowStyle} 
                                            onChange={e => setWindowStyle(e.target.value as any)}
                                            className="rounded border border-gray-900 bg-gray-900 px-2 py-1 text-xs text-white outline-none"
                                        >
                                            <option value="mac">macOS</option>
                                            <option value="windows">Windows</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[9px] text-gray-500">
                                            <span>Rotate X (deg)</span>
                                            <span>{rotateX}°</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="-45" 
                                            max="45" 
                                            value={rotateX} 
                                            onChange={e => setRotateX(Number(e.target.value))}
                                            className="w-full accent-violet-600 h-1 bg-gray-900 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[9px] text-gray-500">
                                            <span>Rotate Y (deg)</span>
                                            <span>{rotateY}°</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="-45" 
                                            max="45" 
                                            value={rotateY} 
                                            onChange={e => setRotateY(Number(e.target.value))}
                                            className="w-full accent-violet-600 h-1 bg-gray-900 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Render speed multipliers for typer */}
                            {selectedComponent === 'TextTyper' && (
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[9px] text-gray-500">
                                        <span>Typing Speed Multiplier</span>
                                        <span>x{speedMultiplier}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="5" 
                                        step="1"
                                        value={speedMultiplier} 
                                        onChange={e => setSpeedMultiplier(Number(e.target.value))}
                                        className="w-full accent-violet-600 h-1 bg-gray-900 rounded-lg cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
