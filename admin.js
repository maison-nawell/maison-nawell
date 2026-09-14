const GERANTE_EMAIL = "maisonnawell5@gmail.com";
let prestationsCache = [];
/* ========================= INITIALISATION ========================= */
document.addEventListener("DOMContentLoaded", async () => { const { data: { session }, error } = await supabaseClient.auth.getSession();
if (error || !session) {
    window.location.href = "admin-login.html";
    return;
}

if (session.user.email !== GERANTE_EMAIL) {
    await supabaseClient.auth.signOut();
    window.location.href = "admin-login.html";
    return;
}

await loadReservations();
await loadPrestations();

setupEvents();
});
/* ========================= EVENEMENTS ========================= */
function setupEvents() {
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        window.location.href = "admin-login.html";
    });
}

const refreshBtn = document.getElementById("refreshReservations");

if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
        await loadReservations();
    });
}

const prestationForm = document.getElementById("prestationForm");

if (prestationForm) {
    prestationForm.addEventListener("submit", handlePrestationSubmit);
}

const cancelEditBtn = document.getElementById("cancelEdit");

if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetPrestationForm);
}
}
/* ========================= RESERVATIONS ========================= */
async function loadReservations() {
const loading = document.getElementById("reservationsLoading");
const errorBox = document.getElementById("reservationsError");
const empty = document.getElementById("reservationsEmpty");
const tbody = document.getElementById("reservationsBody");

if (loading) loading.style.display = "block";
if (errorBox) {
    errorBox.style.display = "none";
    errorBox.textContent = "";
}
if (empty) empty.style.display = "none";
if (tbody) tbody.innerHTML = "";

try {

    console.log("Chargement des réservations...");

    const { data: reservations, error } = await supabaseClient
        .from("reservations")
        .select("*")
        .order("date_rdv", { ascending: true })
        .order("heure_debut", { ascending: true });

    console.log("Réservations :", reservations);
    console.log("Erreur :", error);

    if (error) {
        throw error;
    }

    if (!reservations || reservations.length === 0) {
        if (empty) empty.style.display = "block";
        return;
    }

    /* Charger les prestations */

    const { data: prestations, error: prestationsError } =
        await supabaseClient
            .from("prestations")
            .select("id, nom");

    if (prestationsError) {
        console.warn(
            "Impossible de charger les prestations :",
            prestationsError
        );
    }

    const prestationsMap = {};

    if (prestations) {
        prestations.forEach(prestation => {
            prestationsMap[prestation.id] = prestation.nom;
        });
    }

    /* Affichage */

    reservations.forEach(reservation => {

        const tr = document.createElement("tr");

        const prestationNom =
            prestationsMap[reservation.prestation_id] ||
            "Prestation supprimée";

        const statut =
            reservation.statu || "en_attente";

        tr.innerHTML = `
            <td>${formatDate(reservation.date_rdv)}</td>

            <td>
                ${formatTime(reservation.heure_debut)}
                ${
                    reservation.heure_fin
                        ? " - " + formatTime(reservation.heure_fin)
                        : ""
                }
            </td>

            <td>
                ${escapeHtml(reservation.nom || "")}
            </td>

            <td>
                ${escapeHtml(reservation.telephone || "")}
            </td>

            <td>
                ${escapeHtml(prestationNom)}
            </td>

            <td>
                <span class="status ${getStatusClass(statut)}">
                    ${formatStatus(statut)}
                    </span>
            </td>

            <td>
                <div class="reservation-actions">

                    ${
                        statut === "en_attente"
                            ? `
                                <button
                                    class="btn-confirm"
                                    onclick="updateReservationStatus(${reservation.id}, 'confirmee')"
                                >
                                    Confirmer
                                </button>
                            `
                            : ""
                    }

                    ${
                        statut !== "annulee"
                            ? `
                                <button
                                    class="btn-cancel"
                                    onclick="updateReservationStatus(${reservation.id}, 'annulee')"
                                >
                                    Annuler
                                </button>
                            `
                            : ""
                    }

                    <button
                        class="btn-delete"
                        onclick="deleteReservation(${reservation.id})"
                    >
                        Supprimer
                    </button>

                </div>
            </td>
        `;

        if (tbody) {
            tbody.appendChild(tr);
        }
    });

} catch (error) {

    console.error("Erreur réservations :", error);

    if (errorBox) {
        errorBox.textContent =
            "Impossible de charger les réservations : " +
            (error.message || error);

        errorBox.style.display = "block";
    }

} finally {

    if (loading) {
        loading.style.display = "none";
    }
}
}
/* ========================= STATUT RESERVATION ========================= */
async function updateReservationStatus(id, newStatus) {
const confirmation = confirm(
    newStatus === "confirmee"
        ? "Confirmer cette réservation ?"
        : "Annuler cette réservation ?"
);

if (!confirmation) {
    return;
}

const { error } = await supabaseClient
    .from("reservations")
    .update({
        statu: newStatus
    })
    .eq("id", id);

if (error) {
    alert("Erreur : " + error.message);
    console.error(error);
    return;
}

await loadReservations();
}
async function deleteReservation(id) {
if (!confirm("Supprimer définitivement cette réservation ?")) {
    return;
}

const { error } = await supabaseClient
    .from("reservations")
    .delete()
    .eq("id", id);

if (error) {
    alert("Erreur : " + error.message);
    console.error(error);
    return;
}

await loadReservations();
}
/* ========================= PRESTATIONS ========================= */
async function loadPrestations() {
const list = document.getElementById("prestationsList");

if (list) {
    list.innerHTML = "<p>Chargement des prestations...</p>";
}

try {

    const { data, error } = await supabaseClient
        .from("prestations")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        throw error;
    }

    prestationsCache = data || [];

    if (!list) {
        return;
    }

    if (prestationsCache.length === 0) {
        list.innerHTML = "<p>Aucune prestation pour le moment.</p>";
        return;
    }

    list.innerHTML = "";

    for (const prestation of prestationsCache) {

        const card = document.createElement("div");

        card.className = "prestation-card";

        let photoUrl = "";

        try {

            const { data: photos } = await supabaseClient
                .from("photos_prestations")
                .select("image_url")
                .eq("prestation_id", prestation.id)
                .eq("actif", true)
                .order("id", { ascending: true })
                .limit(1);

            if (photos && photos.length > 0) {
                photoUrl = photos[0].image_url;
            }

        } catch (photoError) {
            console.warn("Erreur photo :", photoError);
            }

        card.innerHTML = `

            ${
                photoUrl
                    ? `
                        <img
                            src="${escapeAttribute(photoUrl)}"
                            alt="${escapeAttribute(prestation.nom)}"
                            class="prestation-image"
                        >
                    `
                    : `
                        <div class="prestation-image placeholder">
                            Aucune photo
                        </div>
                    `
            }

            <div class="prestation-content">

                <h3>
                    ${escapeHtml(prestation.nom || "")}
                </h3>

                <p>
                    ${escapeHtml(prestation.description || "")}
                </p>

                <div class="prestation-info">
                    <strong>
                        ${prestation.prix ?? 0} €
                    </strong>

                    <span>
                        ${prestation.duree ?? 0} min
                    </span>
                </div>

                <div class="prestation-status">
                    ${
                        prestation.actif
                            ? "Visible sur le site"
                            : "Masquée du site"
                    }
                </div>

                <div class="prestation-actions">

                    <button
                        onclick="editPrestation(${prestation.id})"
                    >
                        Modifier
                    </button>

                    <button
                        onclick="togglePrestation(${prestation.id}, ${!prestation.actif})"
                    >
                        ${
                            prestation.actif
                                ? "Masquer"
                                : "Afficher"
                        }
                    </button>

                    <button
                        class="btn-delete"
                        onclick="deletePrestation(${prestation.id})"
                    >
                        Supprimer
                    </button>

                </div>

            </div>
        `;

        list.appendChild(card);
    }

} catch (error) {

    console.error("Erreur prestations :", error);

    if (list) {
        list.innerHTML = `
            <p class="error">
                Impossible de charger les prestations :
                ${escapeHtml(error.message || String(error))}
            </p>
        `;
    }
}
}
/* ========================= AJOUT / MODIFICATION ========================= */
async function handlePrestationSubmit(event) {
event.preventDefault();

const form = event.target;

const id = document.getElementById("prestationId")?.value || "";

const nom = document.getElementById("prestationNom")?.value.trim() || "";

const prix =
    parseFloat(
        document.getElementById("prestationPrix")?.value
    ) || 0;

const duree =
    parseInt(
        document.getElementById("prestationDuree")?.value
    ) || 0;

const description =
    document.getElementById("prestationDescription")?.value.trim() || "";

const photoInput =
    document.getElementById("prestationPhoto");

if (!nom) {
    alert("Veuillez entrer le nom de la prestation.");
    return;
}

try {

    let prestationId = id;

    /* MODIFICATION */

    if (id) {

        const { error } = await supabaseClient
            .from("prestations")
            .update({
                nom,
                prix,
                duree,
                description
            })
            .eq("id", id);

        if (error) {
            throw error;
        }

    }

    /* AJOUT */

    else {

        const { data, error } = await supabaseClient
            .from("prestations")
            .insert({
                nom,
                prix,
                duree,
                description,
                actif: true
            })
            .select()
            .single();

        if (error) {
            throw error;
        }
        prestationId = data.id;
    }

    /* PHOTO */

    if (
        photoInput &&
        photoInput.files &&
        photoInput.files.length > 0
    ) {

        const file = photoInput.files[0];

        const extension =
            file.name.split(".").pop().toLowerCase();

        const fileName =
            `${prestationId}-${Date.now()}.${extension}`;

        const filePath = fileName;

        const { error: uploadError } =
            await supabaseClient.storage
                .from("prestations")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false
                });

        if (uploadError) {
            throw uploadError;
        }

        const {
            data: publicUrlData
        } = supabaseClient.storage
            .from("prestations")
            .getPublicUrl(filePath);

        const imageUrl =
            publicUrlData.publicUrl;

        const { error: photoDbError } =
            await supabaseClient
                .from("photos_prestations")
                .insert({
                    prestation_id: prestationId,
                    nom: file.name,
                    image_path: filePath,
                    image_url: imageUrl,
                    actif: true
                });

        if (photoDbError) {
            throw photoDbError;
        }
    }

    alert(
        id
            ? "Prestation modifiée avec succès."
            : "Prestation ajoutée avec succès."
    );

    resetPrestationForm();

    await loadPrestations();

} catch (error) {

    console.error("Erreur prestation :", error);

    alert(
        "Impossible d'enregistrer la prestation :\n\n" +
        (error.message || error)
    );
}
}
/* ========================= MODIFIER ========================= */
function editPrestation(id) {
const prestation =
    prestationsCache.find(
        p => String(p.id) === String(id)
    );

if (!prestation) {
    return;
}

const idInput =
    document.getElementById("prestationId");

const nomInput =
    document.getElementById("prestationNom");

const prixInput =
    document.getElementById("prestationPrix");

const dureeInput =
    document.getElementById("prestationDuree");

const descriptionInput =
    document.getElementById("prestationDescription");

const submitBtn =
    document.querySelector(
        '#prestationForm button[type="submit"]'
    );

if (idInput) idInput.value = prestation.id;
if (nomInput) nomInput.value = prestation.nom || "";
if (prixInput) prixInput.value = prestation.prix ?? "";
if (dureeInput) dureeInput.value = prestation.duree ?? "";
if (descriptionInput) {
    descriptionInput.value =
        prestation.description || "";
}

if (submitBtn) {
    submitBtn.textContent = "Modifier la prestation";
}

window.scrollTo({
    top: 0,
    behavior: "smooth"
});
}
/* ========================= RESET FORMULAIRE ========================= */
function resetPrestationForm() {
const form =
    document.getElementById("prestationForm");

if (form) {
    form.reset();
}

const idInput =
    document.getElementById("prestationId");

if (idInput) {
    idInput.value = "";
}

const submitBtn =
    document.querySelector(
        '#prestationForm button[type="submit"]'
    );

if (submitBtn) {
    submitBtn.textContent = "Ajouter la prestation";
}
}
/* ========================= AFFICHER / MASQUER ========================= */
async function togglePrestation(id, actif) {
const { error } = await supabaseClient
    .from("prestations")
    .update({
        actif
    })
    .eq("id", id);

if (error) {
    alert("Erreur : " + error.message);
    console.error(error);
    return;
}

await loadPrestations();
}
/* ========================= SUPPRIMER PRESTATION ========================= */
async function deletePrestation(id) {
if (
    !confirm(
        "Supprimer cette prestation ?\n\nCette action est définitive."
    )
) {
    return;
}

const { error } = await supabaseClient
    .from("prestations")
    .delete()
    .eq("id", id);

if (error) {
    alert("Erreur : " + error.message);
    console.error(error);
    return;
}

await loadPrestations();
}
/* ========================= FORMATAGE ========================= */
function formatDate(date) {
if (!date) {
    return "";
}

const parts = date.split("-");

if (parts.length === 3) {
    return       <span class="status ${getStatusC
}

return date;
}
function formatTime(time) {
if (!time) {
    return "";
}

return String(time).slice(0, 5);
}
function formatStatus(status) {
const statuses = {
    en_attente: "En attente",
    confirmee: "Confirmée",
    annulee: "Annulée"
};

return statuses[status] || status;
}
function getStatusClass(status) {
if (status === "confirmee") {
    return "confirmed";
}

if (status === "annulee") {
    return "cancelled";
}

return "pending";
}
/* ========================= SECURITE AFFICHAGE ========================= */
function escapeHtml(value) {
return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function escapeAttribute(value) { return escapeHtml(value); }
