import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Heart,
  Info,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck
} from "lucide-react";
import { apiFetch, assetUrl } from "./api";
import { SEO } from "./components";
import { DistributeModal } from "./distributeModal";
import { BuyModal } from "./buyDrawer";
import { sanitizedHtml } from "./shared/sanitizeHtml";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const BookDetailPage = () => {
  const { slug } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/books/${slug}`)
      .then((data) => {
        setBook(data.book);
        setSelectedImage(data.book?.coverImage || "");
      })
      .catch((err) => console.error("Failed to load book:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  // Check if returning from Google login with pending action
  useEffect(() => {
    const pending = sessionStorage.getItem("book_pending_action");
    if (pending && book) {
      try {
        const parsed = JSON.parse(pending);
        if (parsed.bookSlug === book.slug) {
          sessionStorage.removeItem("book_pending_action");
          if (parsed.action === "distribute") setDistributeOpen(true);
          if (parsed.action === "buy") setBuyOpen(true);
        }
      } catch {}
    }
  }, [book]);

  if (loading) {
    return (
      <div className="mx-auto max-w-shell px-4 py-20 text-center">
        <p className="text-sm font-semibold text-muted">Loading sacred book details...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-shell px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-ink">Book Not Found</h2>
        <p className="mt-2 text-sm text-muted">This sacred book may have been deactivated or moved.</p>
        <Link to="/books" className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-white">
          Back to Books
        </Link>
      </div>
    );
  }

  const allImages = [book.coverImage, ...(book.galleryImages || [])].filter(Boolean);

  return (
    <div className="bg-[#FFFDF9] min-h-screen py-10 md:py-16">
      <SEO
        title={`${book.title} — ISKCON Juhu Self-Excellence`}
        description={book.shortDescription || book.subtitle}
      />

      <div className="mx-auto max-w-shell px-4 sm:px-6">
        {/* Back Link */}
        <Link
          to="/books"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary transition mb-8"
        >
          <ArrowLeft size={14} /> Back to all Sacred Books
        </Link>

        {/* Desktop 2 Columns */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
              {selectedImage ? (
                <img
                  src={assetUrl(selectedImage)}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-muted">
                  <BookOpen size={48} className="text-primary/30" />
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`h-18 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      selectedImage === img ? "border-primary shadow-sm" : "border-black/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={assetUrl(img)} alt={`Thumbnail ${i}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Book Info & Actions */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[2px] text-primary">
                Sacred Scripture
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="mt-1 text-base text-muted font-ui">{book.subtitle}</p>
              )}
              {book.authorOrTranslator && (
                <p className="mt-2 text-xs font-semibold text-ink">
                  By: <span className="text-muted">{book.authorOrTranslator}</span>
                </p>
              )}
            </div>

            {/* Price Box */}
            <div className="rounded-2xl border border-black/10 bg-soft/40 p-4 flex items-center gap-3">
              <span className="font-display text-3xl font-bold text-primary">
                {money(book.pricePerBook)}
              </span>
              <span className="text-xs text-muted">per copy</span>
              {book.mrp && book.mrp > book.pricePerBook && (
                <span className="text-sm text-muted line-through">
                  MRP {money(book.mrp)}
                </span>
              )}
              {book.gstPercent > 0 && (
                <span className="text-xs font-semibold text-muted bg-white px-2 py-0.5 rounded-full border border-black/5">
                  +{book.gstPercent}% GST
                </span>
              )}
            </div>

            {book.shortDescription && (
              <p className="text-sm leading-relaxed text-ink/80 font-ui">
                {book.shortDescription}
              </p>
            )}

            {/* Action Panel Buttons (Desktop) */}
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {book.allowBuy && (
                  <button
                    onClick={() => setBuyOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
                  >
                    <ShoppingBag size={16} /> Buy This Book (Delivery)
                  </button>
                )}

                {book.allowDistribute && (
                  <button
                    onClick={() => setDistributeOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-purple-700 py-3.5 text-xs font-bold text-white shadow-lg shadow-purple-700/20 hover:bg-purple-800 transition"
                  >
                    <Heart size={16} /> Distribute This Book (Seva)
                  </button>
                )}
              </div>

              {!book.allowBuy && !book.allowDistribute && (
                <p className="text-center text-xs text-muted font-bold py-2">
                  Currently unavailable for purchase or distribution.
                </p>
              )}

              <p className="text-center text-[11px] text-muted flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                Payment is made securely via UPI / QR / Bank transfer and verified by our office team.
              </p>
            </div>

            {/* Key Facts / Specifications Table */}
            <div className="rounded-2xl border border-black/5 bg-soft/30 p-5 space-y-2 text-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted mb-3">Book Specifications</p>
              <div className="grid grid-cols-2 gap-y-2">
                {book.language && (
                  <div><span className="text-muted">Language:</span> <span className="font-bold text-ink">{book.language}</span></div>
                )}
                {book.binding && (
                  <div><span className="text-muted">Binding:</span> <span className="font-bold text-ink">{book.binding}</span></div>
                )}
                {book.pages && (
                  <div><span className="text-muted">Pages:</span> <span className="font-bold text-ink">{book.pages}</span></div>
                )}
                {book.publisher && (
                  <div><span className="text-muted">Publisher:</span> <span className="font-bold text-ink">{book.publisher}</span></div>
                )}
              </div>
            </div>

            {/* Highlights */}
            {book.highlights?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-muted">Key Highlights</p>
                <ul className="space-y-1.5">
                  {book.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-ink/80">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full Description */}
            {book.fullDescription && (
              <div className="space-y-2 border-t border-black/5 pt-6">
                <p className="text-xs font-black uppercase tracking-wider text-muted">About This Sacred Literature</p>
                <div
                  className="prose prose-sm max-w-none text-muted leading-relaxed"
                  dangerouslySetInnerHTML={sanitizedHtml(book.fullDescription)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-black/10 p-3 sm:hidden shadow-lg flex gap-2">
        {book.allowBuy && (
          <button
            onClick={() => setBuyOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-3 text-xs font-bold text-white shadow-sm"
          >
            <ShoppingBag size={14} /> Buy Book
          </button>
        )}
        {book.allowDistribute && (
          <button
            onClick={() => setDistributeOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-700 py-3 text-xs font-bold text-white shadow-sm"
          >
            <Heart size={14} /> Distribute Seva
          </button>
        )}
      </div>

      {/* Modals */}
      <DistributeModal
        book={book}
        open={distributeOpen}
        onClose={() => setDistributeOpen(false)}
      />

      <BuyModal
        book={book}
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
      />
    </div>
  );
};
