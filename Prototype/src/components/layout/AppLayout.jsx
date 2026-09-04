import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';
import CommandPaletteModal from '../common/CommandPaletteModal';

export default function AppLayout({ children, company, onShowToast, onTriggerScan }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-[#111827] overflow-hidden font-sans antialiased">
      {/* Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        company={company}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavigation
          onOpenCmdPalette={() => setIsCmdPaletteOpen(true)}
          onTriggerScan={onTriggerScan}
          onShowToast={onShowToast}
          company={company}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Global Command Palette Modal (Cmd + K) */}
      <CommandPaletteModal
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
      />
    </div>
  );
}
