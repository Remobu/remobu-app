export function run(input) {
  const { paymentMethods, localization } = input;
  const country = localization?.country?.isoCode;

  if (country !== "LS") {
    return { operations: [] };
  }

  const operations = paymentMethods
    .filter(pm => !pm.name.toLowerCase().includes("m-pesa"))
    .map(pm => ({
      hide: { paymentMethodId: pm.id }
    }));

  return { operations };
}
