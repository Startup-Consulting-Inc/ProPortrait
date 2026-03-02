/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PortraitGenerator from './components/PortraitGenerator';
import ApiKeyGuard from './components/ApiKeyGuard';

export default function App() {
  return (
    <ApiKeyGuard>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="relative z-10 py-12">
          <PortraitGenerator />
        </div>
      </div>
    </ApiKeyGuard>
  );
}
