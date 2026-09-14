const GERANTE_EMAIL = “maisonnawell5@gmail.com”;
const form = document.getElementById(“prestation-form”);
const prestationId = document.getElementById(“prestation-id”);
const prestationNom = document.getElementById(“prestation-nom”);
const prestationPrix = document.getElementById(“prestation-prix”);
const prestationDuree = document.getElementById(“prestation-duree”);
const prestationDescription = document.getElementById(“prestation-description”);
const prestationPhoto = document.getElementById(“prestation-photo”);
const saveButton = document.getElementById(“save-prestation”);
const cancelEditButton = document.getElementById(“cancel-edit”);
const prestationFormTitle =
document.getElementById(“prestation-form-title”);
const prestationMessage =
document.getElementById(“prestation-message”);
const prestationsList =
document.getElementById(“prestations-list”);
const prestationsLoading =
document.getElementById(“prestations-loading”);
const prestationsError =
document.getElementById(“prestations-error”);
const prestationsEmpty =
document.getElementById(“prestations-empty”);
const reservationsBody =
document.getElementById(“reservations-body”);
const reservationsTable =
document.getElementById(“reservations-table”);
const reservationsLoading =
document.getElementById(“reservations-loading”);
const reservationsError =
document.getElementById(“reservations-error”);
const reservationsEmpty =
document.getElementById(“reservations-empty”);
const globalMessage =
document.getElementById(“global-message”);
// =====================================================
// INITIALISATION
// =====================================================
document.addEventListener(“DOMContentLoaded”, init);
async function init() {
try {

    const {
        data: {
            user
        },
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        throw error;
    }

    if (!user) {

        window.location.href = "admin-login.html";
        return;
    }

    if (
        !user.email ||
        user.email.toLowerCase() !== GERANTE_EMAIL
    ) {

        await supabaseClient.auth.signOut();

        alert(
            "Accès réservé à la gérante."
        );

        window.location.href = "admin-login.html";

        return;
    }

    await Promise.all([
        loadReservations(),
        loadPrestations()
    ]);

} catch (error) {

    console.error(
        "Erreur initialisation :",
        error
    );

    showGlobalError(
        "Impossible de charger l'espace gérante : " +
        getErrorMessage(error)
    );
}
}
// =====================================================
// DÉCONNEXION
// =====================================================
document
.getElementById(“logout-button”)
.addEventListener(“click”, async () => {
    await supabaseClient.auth.signOut();

    window.location.href = "admin-login.html";
});
// =====================================================
// RÉSERVATIONS
// =====================================================
async function loadReservations() {
reservationsLoading.classList.remove("hidden");
reservationsError.classList.add("hidden");
reservationsEmpty.classList.add("hidden");
reservationsTable.classList.add("hidden");

try {

    const {
        data,
        error
    } = await supabaseClient
        .from("reservations")
        .select(`
            id,
            nom_client,
            telephone,
            prestation_id,
            date_reservation,
            heure_reservation,
            statut
        `)
        .order("date_reservation", {
            ascending: true
        })
        .order("heure_reservation", {
            ascending: true
        });

    if (error) {
        throw error;
    }

    const reservations = data || [];

    reservationsLoading.classList.add("hidden");

    if (reservations.length === 0) {

        reservationsEmpty.classList.remove("hidden");
        return;
    }

    reservationsBody.innerHTML = "";

    /*
     * On récupère les prestations séparément.
     * Cela évite de dépendre d'une relation PostgREST
    * qui pourrait ne pas être configurée.
     */
    const {
        data: prestations,
        error: prestationsError
    } = await supabaseClient
        .from("prestations")
        .select("id, nom");

    if (prestationsError) {
        console.warn(
            "Impossible de charger les noms de prestations :",
            prestationsError
        );
    }

    const prestationsMap = {};

    (prestations || []).forEach((p) => {
        prestationsMap[p.id] = p.nom;
    });


    reservations.forEach((reservation) => {

        const row = document.createElement("tr");

        const date = formatDate(
            reservation.date_reservation
        );

        const heure =
            reservation.heure_reservation
                ? reservation.heure_reservation.slice(0, 5)
                : "-";

        const prestation =
            prestationsMap[reservation.prestation_id]
            || "Prestation supprimée";


        row.innerHTML = `
            <td>${escapeHtml(date)}</td>

            <td>${escapeHtml(heure)}</td>

            <td>
                <strong>
                    ${escapeHtml(reservation.nom_client || "-")}
                </strong>
            </td>

            <td>
                ${escapeHtml(reservation.telephone || "-")}
            </td>

            <td>
                ${escapeHtml(prestation)}
            </td>

            <td>
                <span class="status ${escapeHtml(
                    reservation.statut || ""
                )}">
                    ${escapeHtml(
                        formatStatus(reservation.statut)
                    )}
                </span>
            </td>

            <td>
                ${
                    reservation.statut !== "annule"
                    ?
                    `<button
                        class="danger-button"
                        data-cancel-id="${reservation.id}"
                    >
                        ANNULER
                    </button>`
                    :
                    "-"
                }
            </td>
        `;

        reservationsBody.appendChild(row);
    });


    reservationsTable.classList.remove("hidden");

    document
        .querySelectorAll("[data-cancel-id]")
        .forEach((button) => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.cancelId;

                    await cancelReservation(id);
                }
            );
        });

} catch (error) {

    reservationsLoading.classList.add("hidden");

    reservationsError.classList.remove("hidden");

    reservationsError.textContent =
        "Erreur lors du chargement des réservations : " +
        getErrorMessage(error);

    console.error(
        "Erreur réservations :",
        error
    );
}
}
// =====================================================
// ANNULER UNE RÉSERVATION
// =====================================================
async function cancelReservation(id) {
const confirmation = confirm(
    "Voulez-vous vraiment annuler cette réservation ?"
);

if (!confirmation) {
    return;
}

try {

    const {
        error
    } = await supabaseClient
        .from("reservations")
        .update({
            statut: "annule"
        })
        .eq("id", id);

    if (error) {
        throw error;
    }

    showGlobalSuccess(
        "Réservation annulée."
    );

    await loadReservations();

} catch (error) {

    showGlobalError(
        "Impossible d'annuler la réservation : " +
        getErrorMessage(error)
    );
}
}
// =====================================================
// PRESTATIONS
// =====================================================
async function loadPrestations() {
prestationsLoading.classList.remove("hidden");
prestationsError.classList.add("hidden");
prestationsEmpty.classList.add("hidden");

prestationsList.innerHTML = "";

try {

    const {
        data,
        error
    } = await supabaseClient
        .from("prestations")
        .select("*")
        .
        order("id", {
            ascending: true
        });

    if (error) {
        throw error;
    }

    const prestations = data || [];

    prestationsLoading.classList.add("hidden");

    if (prestations.length === 0) {

        prestationsEmpty.classList.remove("hidden");
        return;
    }

    for (const prestation of prestations) {

        const card =
            await createPrestationCard(
                prestation
            );

        prestationsList.appendChild(card);
    }

} catch (error) {

    prestationsLoading.classList.add("hidden");

    prestationsError.classList.remove("hidden");

    prestationsError.textContent =
        "Erreur lors du chargement des prestations : " +
        getErrorMessage(error);

    console.error(
        "Erreur prestations :",
        error
    );
}
}
// =====================================================
// CARTE PRESTATION
// =====================================================
async function createPrestationCard(prestation) {
const card =
    document.createElement("article");

card.className = "prestation-card";

let photoUrl = null;

try {

    const {
        data,
        error
    } = await supabaseClient
        .from("photos_prestations")
        .select("image_url")
        .eq("prestation_id", prestation.id)
        .eq("actif", true)
        .limit(1)
        .maybeSingle();

    if (!error && data) {
        photoUrl = data.image_url;
    }

} catch (error) {

    console.warn(
        "Photo indisponible :",
        error
    );
}


const imageHtml = photoUrl
    ?
    `<img
        src="${escapeHtml(photoUrl)}"
        alt="${escapeHtml(prestation.nom)}"
        class="prestation-image"
    >`
    :
    `<div class="no-image">
        Aucune photo
    </div>`;


card.innerHTML = `

    ${imageHtml}

    <div class="prestation-content">

        <h4>
            ${escapeHtml(prestation.nom)}
        </h4>

        <p class="prestation-description">
            ${
                escapeHtml(
                    prestation.description ||
                    "Aucune description."
                )
            }
        </p>

        <div class="prestation-meta">

            <span>
                ${Number(prestation.prix || 0).toFixed(2)} €
            </span>

            <span>
                ${prestation.duree || 0} min
            </span>

        </div>

        <div class="prestation-meta">

            <span>
                ${
                    prestation.actif
                    ? "Visible"
                    : "Masquée"
                }
            </span>

        </div>

        <div class="prestation-actions">

            <button
                class="secondary-button"
                data-edit-id="${prestation.id}"
            >
                MODIFIER
            </button>

            <button
                class="secondary-button"
                data-toggle-id="${prestation.id}"
            >
                ${
                    prestation.actif
                    ? "MASQUER"
                    : "ACTIVER"
                }
            </button>

            <button
                class="danger-button"
                data-delete-id="${prestation.id}"
            >
                SUPPRIMER
            </button>

        </div>

    </div>
`;


const editButton =
    card.querySelector(
        `[data-edit-id="${prestation.id}"]`
    );

editButton.addEventListener(
    "click",
    () => startEdit(prestation)
);


const toggleButton =
    card.querySelector(
        [data-toggle-id="${prestation.id}"]
    );

toggleButton.addEventListener(
    "click",
    () => togglePrestation(prestation)
);


const deleteButton =
    card.querySelector(
        [data-delete-id="${prestation.id}"]
    );

deleteButton.addEventListener(
    "click",
    () => deletePrestation(prestation)
);


return card;
}
// =====================================================
// AJOUT / MODIFICATION
// =====================================================
form.addEventListener(
“submit”,
savePrestation
);
async function savePrestation(event) {
    event.preventDefault();

prestationMessage.textContent = "";

const id =
    prestationId.value.trim();

const nom =
    prestationNom.value.trim();

const description =
    prestationDescription.value.trim();

const prix =
    Number(prestationPrix.value);

const duree =
    Number(prestationDuree.value);

const photo =
    prestationPhoto.files[0];


if (!nom) {
    showPrestationMessage(
        "Le nom est obligatoire.",
        true
    );
    return;
}

if (!Number.isFinite(prix) || prix < 0) {
    showPrestationMessage(
        "Le prix est invalide.",
        true
    );
    return;
}

if (!Number.isInteger(duree) || duree <= 0) {
    showPrestationMessage(
        "La durée est invalide.",
        true
    );
    return;
}


if (photo && photo.size > 6 * 1024 * 1024) {

    showPrestationMessage(
        "La photo doit faire 6 Mo maximum.",
        true
    );

    return;
}


saveButton.disabled = true;

saveButton.textContent =
    id
    ? "MODIFICATION..."
    : "AJOUT...";


try {

    let prestation;


    // =============================================
    // MODIFICATION
    // =============================================

    if (id) {

        const {
            data,
            error
        } = await supabaseClient
            .from("prestations")
            .update({
                nom,
                description,
                prix,
                duree
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        prestation = data;


    // =============================================
    // AJOUT
    // =============================================

    } else {

        const {
            data,
            error
        } = await supabaseClient
            .from("prestations")
            .insert({
                nom,
                description,
                prix,
                duree,
                actif: true
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        prestation = data;
    }


    // =============================================
    // PHOTO
    // =============================================

    if (photo) {

        const extension =
            getExtension(photo.name);

        const safeName =
            slugify(nom);

        const uniqueName =
            async () => {
    await supabaseClient.au

        const path =
            prestations/${prestation.id}/${uniqueName};


        const {
            error: uploadError
        } = await supabaseClient
            .storage
            .from("prestations")
            .upload(
                path,
                photo,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: photo.type
                }
            );


        if (uploadError) {
            throw uploadError;
        }


        const {
            data: publicData
        } = supabaseClient
            .storage
            .from("prestations")
            .getPublicUrl(path);


        const imageUrl =
            publicData.publicUrl;


        /*
         * Pour une modification, on désactive
         * les anciennes photos de cette prestation.
         */
        if (id) {

            const {
                error: oldPhotoError
            } = await supabaseClient
                .from("photos_prestations")
                .update({
                    actif: false
                })
                .eq("prestation_id", prestation.id);

            if (oldPhotoError) {
                console.warn(
                    "Anciennes photos :",
                    oldPhotoError
                );
            }
        }


        const {
            error: photoInsertError
        } = await supabaseClient
            .from("photos_prestations")
            .insert({
                prestation_id: prestation.id,
                nom: photo.name,
                image_path: path,
                image_url: imageUrl,
                actif: true
            });


        if (photoInsertError) {
            throw photoInsertError;
        }
    }


    showPrestationMessage(
        id
            ? "Prestation modifiée avec succès."
            : "Prestation ajoutée avec succès.",
        false
    );


    resetPrestationForm();

    await loadPrestations();


} catch (error) {

    console.error(
        "Erreur prestation :",
        error
    );

    showPrestationMessage(
        getErrorMessage(error),
        true
    );

} finally {

    saveButton.disabled = false;

    saveButton.textContent =
        prestationId.value
        ? "MODIFIER LA PRESTATION"
        : "AJOUTER LA PRESTATION";
}
}
// =====================================================
// MODIFICATION
// =====================================================
function startEdit(prestation) {
prestationId.value =
    prestation.id;

prestationNom.value =
    prestation.nom || "";

prestationPrix.value =
    prestation.prix || "";

prestationDuree.value =
    prestation.duree || "";

prestationDescription.value =
    prestation.description || "";

prestationPhoto.value = "";

prestationFormTitle.textContent =
    "Modifier la prestation";

saveButton.textContent =
    "MODIFIER LA PRESTATION";

cancelEditButton.classList.remove(
    "hidden"
);

window.scrollTo({
    top: 0,
    behavior: "smooth"
});
}
// =====================================================
// ANNULER MODIFICATION
// =====================================================
cancelEditButton.addEventListener(
“click”,
resetPrestationForm
);
function resetPrestationForm() {
form.reset();

prestationId.value = "";

prestationFormTitle.textContent =
    "Ajouter une prestation";

saveButton.textContent =
    "AJOUTER LA PRESTATION";

cancelEditButton.classList.add(
    "hidden"
);

prestationMessage.textContent = "";
}
// =====================================================
// ACTIVER / MASQUER
// =====================================================
async function togglePrestation(prestation) {
try {

    const {
        error
    } = await supabaseClient
        .from("prestations")
        .update({
            actif: !prestation.actif
        })
        .eq("id", prestation.id);

    if (error) {
        throw error;
    }

    await loadPrestations();

} catch (error) {

    showGlobalError(
        "Impossible de modifier la visibilité : " +
        getErrorMessage(error)
    );
}
}
// =====================================================
// SUPPRIMER
// =====================================================
async function deletePrestation(prestation) {
const confirmation = confirm(
   lient
        .from("prestations")
        .select);

if (!confirmation) {
    return;
}


try {

    /*
     * Les photos liées seront supprimées de la table
     * photos_prestations grâce à ON DELETE CASCADE.
     */

    const {
        error
    } = await supabaseClient
        .from("prestations")
        .delete()
        .eq("id", prestation.id);

    if (error) {
        throw error;
    }

    showGlobalSuccess(
        "Prestation supprimée."
    );

    await loadPrestations();

} catch (error) {

    showGlobalError(
        "Impossible de supprimer la prestation : " +
        getErrorMessage(error)
    );
}
}
// =====================================================
// ACTUALISATION
// =====================================================
document
.getElementById(“refresh-reservations”)
.addEventListener(
“click”,
loadReservations
);
document
.getElementById(“refresh-prestations”)
.addEventListener(
“click”,
loadPrestations
);
// =====================================================
// MESSAGES
// =====================================================
function showPrestationMessage(
text,
isError
) {
prestationMessage.textContent =
    text;

prestationMessage.style.color =
    isError
    ? "#9b2c2c"
    : "#31613a";
}
function showGlobalError(text) {
globalMessage.textContent =
    text;

globalMessage.style.background =
    "#fff0f0";

globalMessage.style.color =
    "#9b2c2c";

globalMessage.classList.remove(
    "hidden"
);
}
function showGlobalSuccess(text) {
globalMessage.textContent =
    text;

globalMessage.style.background =
    "#e9f3e9";

globalMessage.style.color =
    "#31613a";

globalMessage.classList.remove(
    "hidden"
);

setTimeout(() => {

    globalMessage.classList.add(
        "hidden"
    );

}, 4000);
}
// =====================================================
// OUTILS
// =====================================================
function getErrorMessage(error) {
if (!error) {
    return "Erreur inconnue.";
}

return (
    error.message ||
    error.details ||
    error.hint ||
    "Erreur inconnue."
);
}
function formatDate(dateString) {
if (!dateString) {
    return "-";
}

const parts =
    dateString.split("-");

if (parts.length !== 3) {
    return dateString;
}

return   window.location.href = "admin-login.
}
function formatStatus(status) {
const labels = {
    confirmee: "Confirmée",
    en_attente: "En attente",
    annule: "Annulée"
};

return labels[status]  status  "-";
}
function escapeHtml(value) {
return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function slugify(value) {
return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}
function getExtension(filename) {
const parts =
    filename.split(".");

if (parts.length < 2) {
    return "jpg";
}

const extension =
    parts.pop().toLowerCase();

const allowed = [
    "jpg",
    "jpeg",
    "png",
    "webp"
];

return allowed.includes(extension)
    ? extension
    : "jpg";
}
