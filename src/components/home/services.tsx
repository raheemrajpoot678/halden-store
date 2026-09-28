import { services } from "@/lib/catalog";

export function Services() {
  return (
    <section aria-labelledby="services-title" className="border-t bg-surface py-block">
      <h2 id="services-title" className="sr-only">
        Our services
      </h2>
      <ul className="container-page grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <li key={service.title} className="flex flex-col gap-2 text-center">
            <h3 className="ui-label">{service.title}</h3>
            <p className="text-body-sm text-ink-muted">{service.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
