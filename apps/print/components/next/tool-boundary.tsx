import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode; onReload: () => Promise<void>; onBackup: () => void };

/** Keep the parent workspace alive if a lazy tool fails during a deployment. */
export default class ToolBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section role="alert" style={{ padding: 28, border: '1px solid #d4ddc9', borderRadius: 12, background: '#fafbf3', color: '#183e36' }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>Let’s reopen this tool.</h2>
      <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 560 }}>An update may have arrived, or this tool could not load. Your workspace is still available. Save it before reloading, or export a backup.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
        <button className="av-btn primary" onClick={() => void this.props.onReload()}>Save &amp; reload</button>
        <button className="av-btn" onClick={this.props.onBackup}>Export workspace backup</button>
      </div>
    </section>;
  }
}
