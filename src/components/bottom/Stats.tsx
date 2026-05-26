import { type StatType } from "@/types"

const Stats = ({ stats }: { stats: StatType[] }) => {
    return (
        <div>
            <section
                style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: 'clamp(40px,8vw,64px) 24px',
                }}
            >
                <div className="ck-stats">
                    {stats.map((s: StatType, i: number) => (
                        <div key={i}>
                            <div
                                style={{
                                    fontSize: 'clamp(1.6rem,3vw,2.2rem)',
                                    fontWeight: 700,
                                    letterSpacing: '-0.04em',
                                    marginBottom: 6,
                                    color: '#fff',
                                }}
                            >
                                {s.value}
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: 'rgba(255,255,255,0.4)',
                                    fontWeight: 500,
                                }}
                            >
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default Stats
