import { Link } from 'react-router-dom'
import { toast } from 'sonner'

const BottomCallToAction = () => {
    return (
        <section className="ck-final-section">
            <div className="ck-final-grid">
                <div className="ck-term-card">
                    <div className="ck-term-topbar">
                        <span className="ck-term-dot" style={{ background: '#ff5f57' }} />
                        <span className="ck-term-dot" style={{ background: '#febc2e' }} />
                        <span className="ck-term-dot" style={{ background: '#28c840' }} />
                        <span className="ck-term-filename">~/cloudkit</span>
                    </div>
                    <div className="ck-term-body">
                        <div><span className="ck-term-prompt">$</span>git push origin main</div>
                        <div className="ck-term-out">→ Building your app…</div>
                        <div className="ck-term-out">
                            → Deployed to production <span className="ck-term-ok">✓</span> live in 47s
                        </div>
                        <div><span className="ck-term-prompt">$</span><span className="ck-term-cursor" /></div>
                    </div>
                    <div className="ck-term-content">
                        <span className="ck-term-chip">🚀 Ready to deploy?</span>
                        <h3 className="ck-term-heading">Start building with a free account.</h3>
                        <p className="ck-term-copy">
                            Speak to an expert for your{' '}
                            <span style={{ color: '#66b2ff', fontWeight: 500 }}>Pro</span>{' '}
                            or{' '}
                            <span style={{ color: '#c893f0', fontWeight: 500 }}>Enterprise</span>{' '}
                            needs.
                        </p>
                        <Link className="ck-btn-primary" to="/login">
                            Start Deploying
                        </Link>
                    </div>
                </div>

                <div className="ck-ent-card">
                    <span className="ck-chip">Enterprise</span>
                    <h3 className="ck-ent-heading">Explore CloudKit Enterprise</h3>
                    <p className="ck-ent-copy">
                        With an interactive product tour, trial, or personalized demo
                        tailored to your team.
                    </p>
                    <div
                        onClick={() => {
                            const toastId = toast.loading('Preparing...')
                            setTimeout(() => toast.dismiss(toastId), 1000)
                            setTimeout(() => toast.info('Coming Soon!'), 1000)
                        }}
                        className="ck-btn-outline"
                    >
                        Explore Enterprise →
                    </div>
                </div>
            </div>
        </section>
    )
}

export default BottomCallToAction