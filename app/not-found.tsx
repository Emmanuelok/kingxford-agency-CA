import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-hero" aria-labelledby="not-found-title">
      <div className="shell stack">
        <p className="eyebrow">404 / Signal lost</p>
        <h1 className="display" id="not-found-title">
          This page drifted off course.
        </h1>
        <p className="lede">
          The address may have changed, or the page may never have existed. Return to the studio or
          explore what KINGXFORD can build.
        </p>
        <div className="cluster">
          <Link className="button button--primary" href="/">
            Return home
          </Link>
          <Link className="button button--outline" href="/services">
            Explore services
          </Link>
        </div>
      </div>
    </section>
  );
}
