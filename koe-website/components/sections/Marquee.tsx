export function Marquee() {
    const text = "NO SUBSCRIPTIONS // LOCAL VAD // OPEN SOURCE // HIGH SPEED // PERFECT PRIVACY // ";

    return (
        <div className="marquee">
            <div className="marquee-content font-bold tracking-widest text-lg">
                {text.repeat(3)}
            </div>
        </div>
    );
}
