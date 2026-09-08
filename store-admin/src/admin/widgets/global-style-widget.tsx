import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

const GlobalStyleWidget = () => {
    useEffect(() => {
        // Find text nodes that look like phone numbers (e.g. +98 914 ...) and wrap/fix them
        const fixPhoneNumbers = () => {
            const elements = document.querySelectorAll('span, p, div, a');
            elements.forEach(el => {
                const text = el.textContent?.trim();
                // If it contains a '+' and numbers, and is mostly numbers/spaces/dashes
                if (text && text.includes('+') && /^[\+\d\s\-\(\)]+$/.test(text)) {
                    if (el.getAttribute('dir') !== 'ltr') {
                        el.setAttribute('dir', 'ltr');
                        (el as HTMLElement).style.textAlign = 'right';
                        (el as HTMLElement).style.display = 'inline-block';
                        (el as HTMLElement).style.unicodeBidi = 'plaintext';
                    }
                }
            });
        };

        // Run initially
        setTimeout(fixPhoneNumbers, 500);
        setTimeout(fixPhoneNumbers, 1500);

        // Run when DOM changes (since Medusa uses React and loads data asynchronously)
        const observer = new MutationObserver((mutations) => {
            fixPhoneNumbers();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [])

    return null
}

export const config = defineWidgetConfig({
    zone: "order.details.side.before",
})

export default GlobalStyleWidget
