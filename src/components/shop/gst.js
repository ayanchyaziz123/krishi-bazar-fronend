// GST (India) in the browser, matching base/gst.py on the server. The server always works
// the tax out again; these are only for showing it before a bill is saved.

export const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28, 40]

export const GST_STATES = [
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
    'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

const round = (n) => Math.round(n * 100) / 100

// The shop's GST settings, from the store details.
export const gstOf = (store) => ({
    mode: 'none', gstin: '', state: '', prices_include_gst: true, ...((store && store.gst) || {}),
})
export const chargesGst = (store) => gstOf(store).mode === 'regular'

// GST on a bill: `lines` are [value, rate]; the discount is shared across lines first.
// Returns the tax and how much is added on top of the line values (0 when prices include GST).
export function gstFor(lines, discount, inclusive) {
    const gross = lines.reduce((n, [v]) => n + v, 0)
    const share = gross ? (gross - Math.min(discount, gross)) / gross : 1
    let tax = 0
    lines.forEach(([value, rate]) => {
        const after = value * share
        tax += inclusive ? round((after * rate) / (100 + rate)) : round((round(after) * rate) / 100)
    })
    tax = round(tax)
    return { tax, added: inclusive ? 0 : tax }
}
