export function Marquee() {
    const text = "FREE BYOK // MANAGED MODE // LOCAL VAD // OPEN SOURCE // HIGH SPEED // ACCOUNT SYNC // ";
    const repeatedText = text.repeat(4);

    return (
        <div className="w-full overflow-hidden whitespace-nowrap border-y border-amber bg-void py-3">
            <div className="animate-marquee inline-block">
                <span className="font-bold tracking-widest text-lg text-amber">
                    {repeatedText}
                </span>
            </div>
        </div>
    );
}
