export function Marquee() {
    const text = "FREE WITH BYOK // MANAGED CLOUD OPTION // LOCAL VAD // DESKTOP + MOBILE // ACCOUNT SYNC // ";

    return (
        <div className="marquee">
            <div className="marquee-content font-bold tracking-widest text-lg">
                {text.repeat(3)}
            </div>
        </div>
    );
}
