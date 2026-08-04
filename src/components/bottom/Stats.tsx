import { type StatType } from "@/types"

const ACCENTS = ['#0071e3', '#34c759', '#f5a623', '#af52de']

const Stats = ({ stats }: { stats: StatType[] }) => {
    return (
        <section className="ck-status-section">
            <div className="ck-status-panel">
                <div className="ck-status-header">
                    <span className="ck-status-dot" aria-hidden="true" />
                    <span className="ck-status-header-label">
                        <b>All systems operational</b> — live platform metrics
                    </span>
                </div>
                <div className="ck-status-row">
                    {stats.map((s, i) => (
                        <div className="ck-status-item" key={i}>
                            <div
                                className="ck-status-value"
                                style={{ color: ACCENTS[i % ACCENTS.length] }}
                            >
                                {s.value}
                            </div>
                            <div className="ck-status-tag">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Stats