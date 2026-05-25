import { Link } from 'react-router-dom'
import { toast } from 'sonner'

const BottomCallToAction = () => {
    return (
        <div>
            <section
                style={{ padding: 'clamp(60px,10vw,100px) clamp(16px,4vw,24px)' }}
            >
                <div className="ck-cta-grid">
                    <div className="ck-gradient-border">
                        <div className="ck-gradient-inner">
                            <span className="ck-chip">🚀 Ready to deploy?</span>
                            <h3
                                style={{
                                    fontSize: 'clamp(1.2rem,2.5vw,1.6rem)',
                                    fontWeight: 700,
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.2,
                                    margin: '16px 0 10px',
                                    color: '#fff',
                                }}
                            >
                                Start building with a free account.
                            </h3>
                            <p
                                style={{
                                    fontSize: 14,
                                    color: 'rgba(255,255,255,0.45)',
                                    lineHeight: 1.65,
                                    marginBottom: 28,
                                }}
                            >
                                Speak to an expert for your{' '}
                                <span style={{ color: '#60a5fa', fontWeight: 500 }}>Pro</span>{' '}
                                or{' '}
                                <span style={{ color: '#a78bfa', fontWeight: 500 }}>
                                    Enterprise
                                </span>{' '}
                                needs.
                            </p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <Link className="ck-btn-primary" to="/login">
                                    Start Deploying
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="ck-card" style={{ padding: 32 }}>
                        <span className="ck-chip">Enterprise</span>
                        <h3
                            style={{
                                fontSize: 'clamp(1.2rem,2.5vw,1.6rem)',
                                fontWeight: 700,
                                letterSpacing: '-0.03em',
                                lineHeight: 1.2,
                                margin: '16px 0 10px',
                                color: '#fff',
                            }}
                        >
                            Explore CloudKit Enterprise
                        </h3>
                        <p
                            style={{
                                fontSize: 14,
                                color: 'rgba(255,255,255,0.45)',
                                lineHeight: 1.65,
                                marginBottom: 28,
                            }}
                        >
                            With an interactive product tour, trial, or personalized demo
                            tailored to your team.
                        </p>
                        <div onClick={() => {
                            let toastId = toast.loading('Preparing...')
                            setTimeout(() => {
                                toast.dismiss(toastId)
                            }, 1000)
                            setTimeout(() => {
                                toast.info('Coming Soon!')
                            }, 1000)

                        }} className="ck-btn-outline">Explore Enterprise →</div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default BottomCallToAction
