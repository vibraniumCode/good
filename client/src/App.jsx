import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CircleHelp, Eye, ImagePlus, ListFilter, LogOut, Package, Pencil, Plus, Search, Shield, ShoppingBag, Trash2, UserRound, X } from 'lucide-react';

const money = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount || 0);
const api = async (url, options = {}) => {
  const response = await fetch(url, { credentials: 'include', ...options, headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers } });
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la acción.');
  return payload;
};
const imageFor = (path) => path?.startsWith('http') ? path : path || '';

function Toast({ text, onDone }) {
  useEffect(() => { if (!text) return; const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [text, onDone]);
  return text ? <div className="toast" role="status"><Check size={16} />{text}</div> : null;
}

function AuthForm({ mode, onMode, onSuccess, onCancel, embedded = false }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try { const result = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) }); onSuccess(result.user); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <form className={`auth-card ${embedded ? 'auth-card-embedded' : ''}`} onSubmit={submit}>
    {!embedded && <button type="button" className="modal-close" aria-label="Cerrar" onClick={onCancel}><X /></button>}
    <span className="eyebrow">Bienvenido a GOOD</span><h2>{mode === 'register' ? 'Creá tu cuenta.' : 'Qué bueno verte.'}</h2><p className="muted">{mode === 'register' ? 'Guardá tus favoritos y seguí tus compras.' : 'Ingresá para seguir con tu compra.'}</p>
    {mode === 'register' && <label>Nombre<input name="name" required minLength="2" autoComplete="name" placeholder="Tu nombre" /></label>}
    <label>Email<input name="email" type="email" required autoComplete="email" placeholder="vos@email.com" /></label>
    <label>Contraseña<input name="password" type="password" required minLength={mode === 'register' ? 10 : 1} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={mode === 'register' ? 'Al menos 10 caracteres' : 'Tu contraseña'} /></label>
    {error && <p className="form-error">{error}</p>}<button className="button button-dark button-wide" disabled={busy}>{busy ? 'Un segundo…' : mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'} <ArrowUpRight size={16} /></button>
    <p className="auth-switch">{mode === 'register' ? '¿Ya tenés cuenta?' : '¿Todavía no tenés cuenta?'} <button type="button" onClick={() => onMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Iniciá sesión' : 'Registrate'}</button></p>
  </form>;
}

function Header({ user, onAuth, onLogout, onCart, cartCount }) {
  return <><div className="announcement">Envío gratis en compras desde $120.000 <span>·</span> 3 cuotas sin interés</div><header className="site-header">
    <a className="wordmark" href="#inicio">good<span>.</span></a><nav className="main-nav"><a href="#perchero">Colección</a><a href="#productos">Tienda</a><a href="#nosotros">Nuestra historia</a></nav>
    <div className="header-actions"><a className="icon-link search-link" href="#productos"><Search size={17} /><span>Buscar</span></a>
      {user?.role === 'admin' && <a className="admin-shortcut" href="/admin"><Shield size={15} /> Admin</a>}
      {user ? <button className="icon-link account-link" onClick={onLogout}><UserRound size={16} /><span>{user.name.split(' ')[0]}</span><LogOut className="logout-icon" size={14} /></button> : <button className="icon-link account-link" onClick={onAuth}><UserRound size={16} /><span>Ingresar</span></button>}
      <button className="icon-link bag-link" onClick={onCart}><ShoppingBag size={17} /><span>Bolsa</span><b className="cart-count">{cartCount}</b></button>
    </div>
  </header></>;
}

function Rail({ products, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const first = products.slice(0, 3);
  const fallback = first.length ? first : [];
  return <section className="rail-section" id="perchero"><div className="rail-heading"><span className="eyebrow">Tocá para descubrir</span><h2>Del perchero a vos.</h2><p>Pasá el cursor por una prenda —o tocala— para verla de cerca.</p></div>
    {fallback.length ? <div className="rail-scene"><div className="rail-pole"><i /><i /></div><div className="rail-row">{fallback.map((product) => { const hasBack = product.backImage && product.backImage !== product.frontImage; return <button className="rail-item" key={product.id} onMouseEnter={() => { setHovered(product.id); onSelect(product); }} onMouseLeave={() => setHovered(null)} onFocus={() => { setHovered(product.id); onSelect(product); }} onClick={() => onSelect(product)} aria-label={`Ver ${product.name}`}>
      <span className="rail-hook" /><span className="hanger"><i /></span><img key={`${product.id}-${hovered === product.id && hasBack ? 'back' : 'front'}`} className="rail-garment" src={imageFor(hovered === product.id && hasBack ? product.backImage : product.frontImage)} alt={product.name} /><span className="rail-name">{product.name}</span>
    </button>; })}</div>
      <div className="rail-hint"><span>Pasá para explorar</span><ArrowDown /></div>
    </div> : <div className="empty-rail">Las prendas nuevas van a aparecer acá. <a href="#productos">Ver catálogo <ArrowRight size={14} /></a></div>}
  </section>;
}
function ArrowDown() { return <span className="down-arrow">↓</span>; }

function ProductCard({ product, onSelect, onAdd }) {
  const [hover, setHover] = useState(false); const hasBack = product.backImage && product.backImage !== product.frontImage;
  return <article className="product-card" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
    <div className="product-visual" onClick={() => onSelect(product)} role="button" tabIndex="0" onKeyDown={(e) => e.key === 'Enter' && onSelect(product)}>
      <img className={`product-photo ${hover ? 'product-photo-hover' : ''}`} src={imageFor(hover && hasBack ? product.backImage : product.frontImage)} alt={product.name} loading="lazy" />
      {product.tags?.[0] && <span className="product-tag">{product.tags[0]}</span>}
      {product.stock <= 0 && <span className="sold-tag">Agotado</span>}
      <button className="quick-add" disabled={product.stock <= 0} onClick={(e) => { e.stopPropagation(); onAdd(product); }}>{product.stock <= 0 ? 'Sin stock' : 'Elegir talle'} <ArrowUpRight size={15} /></button>
    </div>
    <div className="product-meta"><div><button className="product-title" onClick={() => onSelect(product)}>{product.name}</button><span className="product-color">{product.colors?.join(' · ') || product.category}</span></div><div className="price-block">{product.compareAtPrice > product.price && <del>{money(product.compareAtPrice)}</del>}<b>{money(product.price)}</b></div></div>
  </article>;
}

function ProductDetail({ product, onClose, onAdd }) {
  const hasBack = product.backImage && product.backImage !== product.frontImage;
  const [side, setSide] = useState(hasBack ? 'front' : 'front'); const [size, setSize] = useState(product.sizes?.[0] || 'Único');
  const image = side === 'back' && hasBack ? product.backImage : product.frontImage;
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="detail-modal" role="dialog" aria-modal="true" aria-label={product.name}>
    <button className="modal-close" onClick={onClose} aria-label="Cerrar"><X /></button>
    <div className="detail-stage"><img key={`${product.id}-${side}`} className="detail-image" src={imageFor(image)} alt={`${product.name}, vista ${side === 'front' ? 'frontal' : 'trasera'}`} />{product.tags?.[0] && <span className="product-tag">{product.tags[0]}</span>}</div>
    <div className="detail-copy"><span className="eyebrow">{product.category} {product.colors?.length ? `· ${product.colors.join(' / ')}` : ''}</span><h2>{product.name}</h2><b className="detail-price">{money(product.price)}</b>
      {product.description && <p className="detail-description">{product.description}</p>}
      {hasBack ? <div className="side-switch"><button className={side === 'front' ? 'active' : ''} onClick={() => setSide('front')}>Frente</button><button className={side === 'back' ? 'active' : ''} onClick={() => setSide('back')}>Dorso</button></div> : <p className="single-view-note">Hay una sola vista cargada. Podés agregar la otra desde Admin.</p>}
      <div className="size-label">Talle <button className="size-help" type="button"><CircleHelp size={14} /> Guía de talles</button></div><div className="size-options">{(product.sizes?.length ? product.sizes : ['Único']).map((value) => <button key={value} className={size === value ? 'selected' : ''} onClick={() => setSize(value)}>{value}</button>)}</div>
      <button className="button button-dark button-wide" disabled={product.stock <= 0} onClick={() => { onAdd(product, size); onClose(); }}>{product.stock <= 0 ? 'Agotado' : 'Agregar a la bolsa'} <ArrowUpRight size={16} /></button>
      <div className="product-notes"><span>Envíos a todo el país</span><span>Cambios sin vueltas</span></div>
    </div>
  </section></div>;
}

function CartDrawer({ open, cart, onClose, onChange, onAuth, user, toast }) {
  if (!open) return null; const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return <div className="modal-backdrop drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><aside className="cart-drawer"><div className="drawer-head"><div><span className="eyebrow">Tu selección</span><h2>Tu bolsa <sup>{cart.reduce((sum, line) => sum + line.quantity, 0)}</sup></h2></div><button className="modal-close" aria-label="Cerrar bolsa" onClick={onClose}><X /></button></div>
    <div className="cart-lines">{cart.length ? cart.map((line) => <div className="cart-line" key={`${line.product.id}-${line.size}`}><img src={imageFor(line.product.frontImage)} alt=""/><div className="cart-line-info"><b>{line.product.name}</b><small>Talle {line.size}{line.product.colors?.[0] ? ` · ${line.product.colors[0]}` : ''}</small><div className="quantity"><button onClick={() => onChange(line, -1)} aria-label="Restar">−</button><span>{line.quantity}</span><button onClick={() => onChange(line, 1)} aria-label="Sumar">+</button></div></div><b>{money(line.product.price * line.quantity)}</b></div>) : <p className="empty-state">Tu bolsa está esperando algo bueno.</p>}</div>
    <div className="cart-bottom"><div className="subtotal"><span>Subtotal</span><b>{money(subtotal)}</b></div><p>Envío e impuestos se calculan al finalizar.</p><button className="button button-dark button-wide" disabled={!cart.length} onClick={() => { if (!user) { onClose(); onAuth(); } else toast('La conexión de pagos se configura antes de publicar.'); }}>Continuar al pago <ArrowUpRight size={16} /></button></div>
  </aside></div>;
}

function AdminPage({ user, onLogout, toast }) {
  const [products, setProducts] = useState([]); const [categories, setCategories] = useState([]); const [tab, setTab] = useState('products'); const [editing, setEditing] = useState(null); const [showForm, setShowForm] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [newCategory, setNewCategory] = useState('');
  const load = useCallback(async () => { setError(''); try { const [p, c] = await Promise.all([api('/api/products/admin/all'), api('/api/categories/admin/all')]); setProducts(p.products); setCategories(c.categories); } catch (e) { setError(e.message); } }, []);
  useEffect(() => { if (user?.role === 'admin') load(); }, [user, load]);
  if (!user) return <main className="admin-auth"><div className="admin-topline"><a className="wordmark" href="/">good<span>.</span></a><a href="/">Volver a la tienda <ArrowUpRight size={15} /></a></div><div className="admin-login"><Shield size={24} /><span className="eyebrow">Área privada</span><h1>Administración GOOD</h1><p>Iniciá sesión con la cuenta administradora.</p><AuthForm mode="login" onMode={() => {}} onSuccess={() => location.reload()} embedded /></div></main>;
  if (user.role !== 'admin') return <main className="admin-auth"><div className="admin-login"><Shield size={24} /><h1>Acceso restringido</h1><p>Esta cuenta no tiene permisos de administración.</p><button className="button button-dark" onClick={() => location.href = '/'}>Volver a la tienda</button></div></main>;
  const saveProduct = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); const body = new FormData(event.currentTarget);
    body.set('featured', String(body.get('featured') === 'on')); body.set('active', String(body.get('active') === 'on'));
    try { await api(editing ? `/api/products/${editing.id}` : '/api/products', { method: editing ? 'PUT' : 'POST', body }); setShowForm(false); setEditing(null); await load(); toast(editing ? 'Producto actualizado' : 'Producto publicado'); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const deleteProduct = async (product) => { if (!confirm(`¿Borrar ${product.name}?`)) return; try { await api(`/api/products/${product.id}`, { method: 'DELETE' }); await load(); toast('Producto borrado'); } catch (e) { setError(e.message); } };
  const addCategory = async (event) => { event.preventDefault(); try { await api('/api/categories', { method: 'POST', body: JSON.stringify({ name: newCategory }) }); setNewCategory(''); await load(); toast('Categoría creada'); } catch (e) { setError(e.message); } };
  const deleteCategory = async (category) => { if (!confirm(`¿Borrar la categoría ${category.name}?`)) return; try { await api(`/api/categories/${category._id}`, { method: 'DELETE' }); await load(); toast('Categoría borrada'); } catch (e) { setError(e.message); } };
  return <main className="admin-page"><header className="admin-header"><a className="wordmark" href="/">good<span>.</span></a><div className="admin-title"><span className="admin-pill"><Shield size={13} /> Admin</span><span>Hola, {user.name}</span></div><div className="admin-header-actions"><a href="/" className="text-action">Ver tienda <ArrowUpRight size={15} /></a><button className="text-action" onClick={onLogout}><LogOut size={15} /> Salir</button></div></header>
    <section className="admin-main"><div className="admin-intro"><div><span className="eyebrow">Panel de control</span><h1>Tu tienda, a tu manera.</h1><p>Administrá productos, imágenes y categorías de GOOD.</p></div>{tab === 'products' && <button className="button button-dark" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Nuevo producto</button>}</div>
      <div className="admin-stats"><div><Package /><span>Productos</span><b>{products.length}</b></div><div><Eye /><span>Publicados</span><b>{products.filter((p) => p.active).length}</b></div><div><ListFilter /><span>Categorías</span><b>{categories.length}</b></div></div>
      <div className="admin-tabs"><button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Productos</button><button className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>Categorías</button></div>
      {error && <div className="notice-error">{error}<button onClick={() => setError('')}><X size={14} /></button></div>}
      {tab === 'products' ? <div className="table-card"><div className="table-title"><div><h2>Catálogo</h2><p>{products.length} productos cargados</p></div><button className="filter-control"><Search size={14} /> Productos</button></div>
        {products.length ? <div className="table-scroll"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="table-product"><div className="table-thumb"><img src={imageFor(product.frontImage)} alt="" /></div><span><b>{product.name}</b><small>{product.sizes?.join(' · ') || 'Talle único'}</small></span></div></td><td>{product.category}</td><td>{money(product.price)}</td><td>{product.stock}</td><td><span className={`status ${product.active ? 'status-live' : ''}`}>{product.active ? 'Publicado' : 'Oculto'}</span></td><td><div className="row-actions"><button title="Editar" onClick={() => { setEditing(product); setShowForm(true); }}><Pencil size={15} /></button><button title="Borrar" onClick={() => deleteProduct(product)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div> : <div className="admin-empty"><Package size={24} /><p>Todavía no hay productos. Cargá el primero para empezar.</p><button className="button button-dark" onClick={() => setShowForm(true)}><Plus size={16} /> Crear producto</button></div>}</div> : <div className="category-panel"><div><span className="eyebrow">Organizá el catálogo</span><h2>Categorías</h2><p>Se usan para filtrar los productos de la tienda.</p></div><form onSubmit={addCategory} className="category-add"><input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Ej. Abrigos" required /><button className="button button-dark"><Plus size={16} /> Crear</button></form><div className="category-list">{categories.map((c) => <div key={c._id}><span>{c.name}</span><button onClick={() => deleteCategory(c)} aria-label={`Borrar ${c.name}`}><Trash2 size={15} /></button></div>)}</div></div>}
    </section>
    {showForm && <ProductForm product={editing} categories={categories} error={error} busy={busy} onSubmit={saveProduct} onClose={() => { setShowForm(false); setEditing(null); setError(''); }} />}
  </main>;
}

function ProductForm({ product, categories, error, busy, onSubmit, onClose }) {
  const [frontPreview, setFrontPreview] = useState(product?.frontImage || ''); const [backPreview, setBackPreview] = useState(product?.backImage || '');
  const preview = (event, setter) => { const file = event.target.files?.[0]; if (file) setter(URL.createObjectURL(file)); };
  return <div className="modal-backdrop form-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="product-form-modal" onSubmit={onSubmit} encType="multipart/form-data">
    <div className="form-head"><div><span className="eyebrow">{product ? 'Editar catálogo' : 'Nuevo ingreso'}</span><h2>{product ? 'Actualizar producto' : 'Crear producto'}</h2></div><button type="button" className="modal-close" onClick={onClose}><X /></button></div>
    <div className="form-scroll"><div className="form-grid"><label>Nombre del producto<input name="name" defaultValue={product?.name || ''} placeholder="Buzo Borovi" required /></label><label>Categoría<select name="category" defaultValue={product?.category || categories[0]?.name || ''} required>{categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}</select></label>
      <label>Precio (ARS)<input name="price" type="number" min="0" step="1" defaultValue={product?.price ?? ''} required /></label><label>Precio anterior (opcional)<input name="compareAtPrice" type="number" min="0" step="1" defaultValue={product?.compareAtPrice ?? ''} /></label>
      <label>Stock<input name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? 0} required /></label><label>Talles <small>Separados por coma</small><input name="sizes" defaultValue={product?.sizes?.join(', ') || 'S, M, L, XL'} placeholder="XS, S, M, L" /></label>
      <label>Colores <small>Separados por coma</small><input name="colors" defaultValue={product?.colors?.join(', ') || ''} placeholder="Charcoal, Arena" /></label><label>Etiquetas <small>Separadas por coma</small><input name="tags" defaultValue={product?.tags?.join(', ') || ''} placeholder="Nuevo, Más vendido" /></label>
      <label className="span-two">Descripción<textarea name="description" rows="3" defaultValue={product?.description || ''} placeholder="Contá algo sobre la prenda…" /></label>
    </div>
    <div className="upload-heading"><div><h3>Fotos del producto</h3><p>Separaremos el fondo y dejaremos la prenda en PNG transparente.</p></div><ImagePlus size={19} /></div>
    <div className="upload-grid"><label className="upload-slot"><input name="frontImage" type="file" accept="image/png,image/jpeg,image/webp" required={!product} onChange={(e) => preview(e, setFrontPreview)} /><span className="upload-preview">{frontPreview ? <img src={imageFor(frontPreview)} alt="Vista previa frente" /> : <ImagePlus size={22} />}</span><span><b>Vista de frente</b><small>{product ? 'Subí otra imagen para reemplazar' : 'Obligatoria · JPG, PNG o WebP'}</small></span></label>
      <label className="upload-slot"><input name="backImage" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => preview(e, setBackPreview)} /><span className="upload-preview">{backPreview ? <img src={imageFor(backPreview)} alt="Vista previa dorso" /> : <ArrowLeft size={22} />}</span><span><b>Vista del dorso</b><small>{product ? 'Opcional · deja la anterior si está vacío' : 'Opcional · cargá las dos vistas'}</small></span></label></div>
    <div className="form-checks"><label><input type="checkbox" name="featured" defaultChecked={product?.featured || false} /> Destacar en el perchero</label><label><input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Publicar en la tienda</label></div>
    {error && <p className="form-error">{error}</p>}</div>
    <div className="form-footer"><button type="button" className="button button-quiet" onClick={onClose}>Cancelar</button><button className="button button-dark" disabled={busy}>{busy ? 'Procesando fotos…' : product ? 'Guardar cambios' : 'Guardar producto'} <ArrowUpRight size={16} /></button></div>
  </form></div>;
}

function Shop({ products, categories, loading, error, onSelect, onAdd }) {
  const [category, setCategory] = useState('Todos'); const [search, setSearch] = useState('');
  const shown = useMemo(() => products.filter((p) => (category === 'Todos' || p.category === category) && `${p.name} ${p.category} ${(p.colors || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())), [products, category, search]);
  return <><main id="inicio"><section className="hero"><div className="hero-photo" /><div className="hero-shade" /><div className="hero-copy"><span className="eyebrow">Colección otoño / invierno 26</span><h1>Vestite<br />como sos.</h1><p>Prendas para hacer lugar a lo que importa. Diseño consciente, comodidad real y ese algo que te hace vos.</p><a className="button button-lime" href="#perchero">Descubrí la colección <ArrowUpRight size={16} /></a></div><span className="hero-pagination">01 <i /> 03</span></section>
    <div className="ticker"><span>Hecho para durar</span><span>Menos, mejor</span><span>Tu estilo, tus reglas</span></div>
    <Rail products={products} onSelect={onSelect} />
    <section className="shop-section" id="productos"><div className="section-head"><div><span className="eyebrow">Elegidos para vos</span><h2>Lo nuevo en GOOD</h2></div><div className="catalog-tools"><div className="search-box"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar prendas" aria-label="Buscar prendas" /></div></div></div>
      <div className="filter-row"><button className={category === 'Todos' ? 'filter active' : 'filter'} onClick={() => setCategory('Todos')}>Todo</button>{categories.map((c) => <button key={c._id || c.slug} className={category === c.name ? 'filter active' : 'filter'} onClick={() => setCategory(c.name)}>{c.name}</button>)}</div>
      {loading ? <div className="loading-grid"><div /><div /><div /><div /></div> : error ? <div className="error-box">{error}</div> : shown.length ? <div className="product-grid">{shown.map((product) => <ProductCard key={product.id} product={product} onSelect={onSelect} onAdd={onAdd} />)}</div> : <div className="empty-catalog"><Package size={24} /><h3>{search ? 'No encontramos prendas con ese nombre.' : 'Estamos preparando la colección.'}</h3><p>Volvé pronto para descubrir lo nuevo de GOOD.</p></div>}
    </section>
    <section className="editorial" id="nosotros"><div className="editorial-image" /><div className="editorial-copy"><span className="eyebrow">Una forma de elegir</span><h2>Menos cosas.<br />Más vos.</h2><p>Creemos en prendas que se quedan. Diseñamos en Buenos Aires, elegimos materiales con intención y hacemos colecciones para usar una y otra vez.</p><a href="#productos" className="button button-outline">Conocé GOOD <ArrowUpRight size={16} /></a></div></section>
    <section className="service-row"><div><span>✳</span><div><b>Hecho con intención</b><p>Materiales elegidos para acompañarte mucho tiempo.</p></div></div><div><span>↗</span><div><b>Envíos a todo el país</b><p>Gratis desde $120.000. Seguimiento en cada paso.</p></div></div><div><span>↺</span><div><b>Cambios sin vueltas</b><p>Tenés 30 días para encontrar tu talle ideal.</p></div></div></section>
    <Newsletter /><footer className="site-footer"><div><a className="wordmark" href="#inicio">good<span>.</span></a><p>Buenos Aires, Argentina · Hecho para vos.</p><small>© GOOD 2026</small></div><div className="footer-links"><a href="#nosotros">Nuestra historia</a><a href="#productos">La tienda</a><a href="mailto:hola@good.com.ar">Contacto</a></div></footer></main></>;
}

function Newsletter() {
  const [email, setEmail] = useState(''); const [sent, setSent] = useState(false);
  return <section className="newsletter"><div><span className="eyebrow">La buena lista</span><h2>Un poco de GOOD<br />en tu inbox.</h2><p>Novedades, ideas y un 10% en tu primera compra.</p></div><form onSubmit={(e) => { e.preventDefault(); setSent(true); setEmail(''); }}><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Tu email" aria-label="Tu email" /><button aria-label="Suscribirme">{sent ? <Check /> : <ArrowUpRight />}</button></form></section>;
}

export default function App() {
  const [user, setUser] = useState(null); const [authChecked, setAuthChecked] = useState(false); const [authOpen, setAuthOpen] = useState(false); const [authMode, setAuthMode] = useState('login');
  const [products, setProducts] = useState([]); const [categories, setCategories] = useState([]); const [loading, setLoading] = useState(true); const [storeError, setStoreError] = useState(''); const [selected, setSelected] = useState(null); const [cartOpen, setCartOpen] = useState(false); const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('good-cart') || '[]')); const [notice, setNotice] = useState('');
  const toast = useCallback((message) => setNotice(message), []);
  useEffect(() => { document.title = location.pathname === '/admin' ? 'Administración · GOOD' : 'GOOD — Vestite como sos'; }, []);
  useEffect(() => { api('/api/auth/me').then((data) => setUser(data.user)).catch(() => {}).finally(() => setAuthChecked(true)); }, []);
  const loadCatalog = useCallback(async () => { setLoading(true); setStoreError(''); try { const [p, c] = await Promise.all([api('/api/products'), api('/api/categories')]); setProducts(p.products); setCategories(c.categories); } catch (e) { setStoreError(e.message); } finally { setLoading(false); } }, []);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  useEffect(() => { localStorage.setItem('good-cart', JSON.stringify(cart)); }, [cart]);
  const addToCart = (product, size = product.sizes?.[0] || 'Único') => { setCart((current) => { const key = `${product.id}-${size}`; const line = current.find((item) => `${item.product.id}-${item.size}` === key); return line ? current.map((item) => `${item.product.id}-${item.size}` === key ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { product, size, quantity: 1 }]; }); toast(`${product.name} agregado a tu bolsa`); };
  const changeQuantity = (line, amount) => setCart((current) => current.map((item) => item === line || (item.product.id === line.product.id && item.size === line.size) ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  const logout = async () => { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); if (location.pathname === '/admin') location.href = '/'; else toast('Sesión cerrada'); };
  const signedIn = (value) => { setUser(value); setAuthOpen(false); toast(`¡Hola, ${value.name.split(' ')[0]}!`); };
  const admin = location.pathname.startsWith('/admin'); const cartCount = cart.reduce((n, line) => n + line.quantity, 0);
  return <>{!admin && <Header user={user} onAuth={() => { setAuthMode('login'); setAuthOpen(true); }} onLogout={logout} onCart={() => setCartOpen(true)} cartCount={cartCount} />}
    {admin ? <AdminPage user={authChecked ? user : null} onLogout={logout} toast={toast} /> : <Shop products={products} categories={categories} loading={loading} error={storeError} onSelect={setSelected} onAdd={(product) => setSelected(product)} />}
    {authOpen && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setAuthOpen(false)}><AuthForm mode={authMode} onMode={setAuthMode} onSuccess={signedIn} onCancel={() => setAuthOpen(false)} /></div>}
    {selected && <ProductDetail key={selected.id} product={selected} onClose={() => setSelected(null)} onAdd={addToCart} />}
    <CartDrawer open={cartOpen} cart={cart} onClose={() => setCartOpen(false)} onChange={changeQuantity} onAuth={() => { setAuthMode('login'); setAuthOpen(true); }} user={user} toast={toast} />
    <Toast text={notice} onDone={() => setNotice('')} />
  </>;
}
