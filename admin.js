const ADMIN_EMAIL = "maisonnawell776@gmail.com";
const reservationsTable = document.getElementById("reservations");
const adminEmail = document.getElementById("admin-email");
const deconnexion = document.getElementById("deconnexion");
const actualiserReservations = document.getElementById("actualiser-reservations");
const nouvellePrestation = document.getElementById("nouvelle-prestation");
const formulaire = document.getElementById("formulaire-prestation");
const annulerFormulaire = document.getElementById("annuler-formulaire");
const sauvegarder = document.getElementById("sauvegarder-prestation");
const listePrestations = document.getElementById("liste-prestations");
const messagePrestation = document.getElementById("message-prestation");
const prestationId = document.getElementById("prestation-id");
const prestationNom = document.getElementById("prestation-nom");
const prestationDescription = document.getElementById("prestation-description");
const prestationDuree = document.getElementById("prestation-duree");
const prestationPrix = document.getElementById("prestation-prix");
const prestationPhoto = document.getElementById("prestation-photo");
const titreFormulaire = document.getElementById("titre-formulaire");
async function verifierConnexion() {
const {
    data: { user },
    error
} = await supabaseClient.auth.getUser();

if (error || !user) {
    window.location.href =
        "admin-login.html";
    return null;
}

if (user.email !== ADMIN_EMAIL) {
    await supabaseClient.auth.signOut();
    window.location.href =
        "admin-login.html";
    return null;
}

adminEmail.textContent =
    user.email;

return user;
}
/* ========================= RENDEZ-VOUS ========================= */
async function chargerReservations() {
reservationsTable.innerHTML = `
    <tr>
        <td colspan="7">
            Chargement...
        </td>
    </tr>
`;

const { data, error } =
    await supabaseClient
        .from("reservations")
        .select(`
            id,
            nom,
            telephone,
            date_rdv,
            heure_debut,
            heure_fin,
            statut,
            prestations (
                nom
            )
        `)
        .order("date_rdv", {
            ascending: true
        })
        .order("heure_debut", {
            ascending: true
        });

if (error) {

    console.error(error);

    reservationsTable.innerHTML = `
        <tr>
            <td colspan="7">
                Impossible de charger les rendez-vous.
            </td>
        </tr>
    `;

    return;
}

if (!data || data.length === 0) {

    reservationsTable.innerHTML = `
        <tr>
            <td colspan="7">
                Aucun rendez-vous.
            </td>
        </tr>
    `;

    return;
}

reservationsTable.innerHTML = "";

data.forEach((reservation) => {

    const ligne =
        document.createElement("tr");

    const date =
        new Date(
            reservation.date_rdv +
            "T00:00:00"
        );

    const dateFormatee =
        date.toLocaleDateString(
            "fr-FR"
        );

    const heureDebut =
        String(
            reservation.heure_debut
        ).slice(0, 5);

    const heureFin =
        String(
            reservation.heure_fin
        ).slice(0, 5);

    ligne.innerHTML = `
        <td>${dateFormatee}</td>

        <td>
            ${heureDebut} - ${heureFin}
        </td>

        <td>
            ${escapeHtml(reservation.nom)}
        </td>

        <td>
            ${escapeHtml(reservation.telephone)}
        </td>

        <td>
            ${
                reservation.prestations
                    ? escapeHtml(
                        reservation.prestations.nom
                    )
                    : "—"
            }
        </td>

        <td>
            ${escapeHtml(reservation.statut)}
        </td>

        <td>

            ${
                reservation.statut !== "annule"
                ? `
                    <button
                        type="button"
                        class="btn-annuler"
data-id="${reservation.id}"
                    >
                        ANNULER
                    </button>
                `
                : "Annulé"
            }

        </td>
    `;

    reservationsTable.appendChild(ligne);
});

document
    .querySelectorAll(".btn-annuler")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => annulerReservation(
                button.dataset.id
            )
        );

    });
}
async function annulerReservation(id) {
if (
    !confirm(
        "Voulez-vous vraiment annuler ce rendez-vous ?"
    )
) {
    return;
}

const { error } =
    await supabaseClient
        .from("reservations")
        .update({
            statut: "annule"
        })
        .eq("id", id);

if (error) {

    alert(
        "Impossible d'annuler le rendez-vous."
    );

    console.error(error);

    return;
}

await chargerReservations();
}
/* ========================= PRESTATIONS ========================= */
async function chargerPrestations() {
listePrestations.innerHTML =
    "Chargement...";

const { data, error } =
    await supabaseClient
        .from("prestations")
        .select("*")
        .order("id", {
            ascending: true
        });

if (error) {

    console.error(error);

    listePrestations.innerHTML =
        "Impossible de charger les prestations.";

    return;
}

if (!data || data.length === 0) {

    listePrestations.innerHTML =
        "Aucune prestation.";

    return;
}

listePrestations.innerHTML = "";

for (const prestation of data) {

    const carte =
        document.createElement("article");

    carte.className =
        "prestation-admin";

    let photoUrl = "";

    const { data: photo } =
        await supabaseClient
            .from("photos_prestations")
            .select("image_url")
            .eq(
                "prestation_id",
                prestation.id
            )
            .eq("actif", true)
            .limit(1)
            .maybeSingle();

    if (photo) {
        photoUrl =
            photo.image_url;
    }

    carte.innerHTML = `

        ${
            photoUrl
            ? `
                <img
                    src="${photoUrl}"
                    alt="${escapeHtml(
                        prestation.nom
                    )}"
                >
            `
            : ""
        }

        <div class="prestation-admin-content">

            <h3>
                ${escapeHtml(
                    prestation.nom
                )}
            </h3>

            <p>
                ${escapeHtml(
                    prestation.description || ""
                )}
            </p>

            <p>
                Durée :
                ${prestation.duree_minutes} min
            </p>

            <p class="prestation-prix">
                ${
                    prestation.prix !== null
                    ? prestation.prix + " €"
                    : "Prix non renseigné"
                }
            </p>

            <p>
                ${
                    prestation.actif
                    ? "✓ Visible sur le site"
                    : "✕ Masquée du site"
                }
            </p>

            <div class="prestation-actions">

                <button
                    type="button"
                    class="btn-modifier"
                    data-id="${prestation.id}"
                >
                    MODIFIER
                </button>

                <button
                    type="button"
                    class="btn-activer"
                    data-id="${prestation.id}"
                >
                    ${
                        prestation.actif
                        ? "MASQUER"
                        : "AFFICHER"
                    }
                </button>

                <button
                    type="button"
                    class="btn-supprimer"
                    data-id="${prestation.id}"
                >
                    SUPPRIMER
                </button>

            </div>
</div>
    `;

    listePrestations.appendChild(carte);
}


document
    .querySelectorAll(".btn-modifier")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => modifierPrestation(
                button.dataset.id
            )
        );

    });


document
    .querySelectorAll(".btn-activer")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => changerVisibilite(
                button.dataset.id
            )
        );

    });


document
    .querySelectorAll(".btn-supprimer")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => supprimerPrestation(
                button.dataset.id
            )
        );

    });
}
/* ========================= AJOUT ========================= */
nouvellePrestation.addEventListener( "click", () => {
    formulaire.hidden = false;

    titreFormulaire.textContent =
        "Ajouter une prestation";

    prestationId.value = "";

    prestationNom.value = "";

    prestationDescription.value = "";

    prestationDuree.value = "";

    prestationPrix.value = "";

    prestationPhoto.value = "";

    messagePrestation.textContent = "";

    formulaire.scrollIntoView({
        behavior: "smooth"
    });
}
);
/* ========================= ANNULER FORMULAIRE ========================= */
annulerFormulaire.addEventListener( "click", () => {
    formulaire.hidden = true;

    messagePrestation.textContent = "";
}
);
/* ========================= MODIFIER ========================= */
async function modifierPrestation(id) {
const { data, error } =
    await supabaseClient
        .from("prestations")
        .select("*")
        .eq("id", id)
        .single();

if (error) {

    alert(
        "Impossible de charger la prestation."
    );

    return;
}

formulaire.hidden = false;

titreFormulaire.textContent =
    "Modifier la prestation";

prestationId.value =
    data.id;

prestationNom.value =
    data.nom;

prestationDescription.value =
    data.description || "";

prestationDuree.value =
    data.duree_minutes;

prestationPrix.value =
    data.prix ?? "";

prestationPhoto.value = "";

messagePrestation.textContent = "";

formulaire.scrollIntoView({
    behavior: "smooth"
});
}
/* ========================= SAUVEGARDER ========================= */
sauvegarder.addEventListener( "click", sauvegarderPrestation );
async function sauvegarderPrestation() {
messagePrestation.textContent =
    "Enregistrement...";

const nom =
    prestationNom.value.trim();

const description =
    prestationDescription.value.trim();

const duree =
    Number(prestationDuree.value);

const prix =
    prestationPrix.value === ""
    ? null
    : Number(prestationPrix.value);

if (!nom) {

    messagePrestation.textContent =
        "Veuillez saisir un nom.";

    return;
}

if (!duree || duree < 30) {

    messagePrestation.textContent =
        "Veuillez saisir une durée valide.";

    return;
}

if (
    prix !== null &&
    (Number.isNaN(prix) || prix < 0)
) {

    messagePrestation.textContent =
        "Veuillez saisir un prix valide.";

    return;
}


let id =
    prestationId.value;


/* MODIFICATION */

if (id) {

    const { error } =
        await supabaseClient
            .from("prestations")
            .update({
                nom,
                description:
                    description || null,
                duree_minutes: duree,
                prix
            })
            .eq("id", id);

    if (error) {

        console.error(error);

        messagePrestation.textContent =
            error.message;

        return;
    }

}


/* AJOUT */

else {

    const { data, error } =
        await supabaseClient
            .from("prestations")
            .insert({
                nom,
                description:
                    description || null,
                duree_minutes: duree,
                prix,
                actif: true
            })
            .select()
            .single();

    if (error) {

        console.
error(error);

        messagePrestation.textContent =
            error.message;

        return;
    }

    id = data.id;
}


/* PHOTO */

const fichier =
    prestationPhoto.files[0];

if (fichier) {

    if (
        !fichier.type.startsWith("image/")
    ) {

        messagePrestation.textContent =
            "Le fichier doit être une image.";

        return;
    }

    if (
        fichier.size > 6 * 1024 * 1024
    ) {

        messagePrestation.textContent =
            "La photo doit faire moins de 6 Mo.";

        return;
    }

    const extension =
        fichier.name
            .split(".")
            .pop()
            .toLowerCase();

    const chemin =
        "prestation-" +
        id +
        "-" +
        Date.now() +
        "." +
        extension;


    const { error: uploadError } =
        await supabaseClient
            .storage
            .from("prestations")
            .upload(
                chemin,
                fichier,
                {
                    contentType:
                        fichier.type,
                    upsert: false
                }
            );

    if (uploadError) {

        console.error(
            uploadError
        );

        messagePrestation.textContent =
            "La photo n'a pas pu être envoyée : " +
            uploadError.message;

        return;
    }


    const { data: publicData } =
        supabaseClient
            .storage
            .from("prestations")
            .getPublicUrl(chemin);


    const imageUrl =
        publicData.publicUrl;


    /* Désactive les anciennes photos */

    await supabaseClient
        .from("photos_prestations")
        .update({
            actif: false
        })
        .eq(
            "prestation_id",
            id
        );


    /* Enregistre la nouvelle photo */

    const { error: photoError } =
        await supabaseClient
            .from("photos_prestations")
            .insert({
                prestation_id: id,
                nom,
                image_path: chemin,
                image_url: imageUrl,
                actif: true
            });

    if (photoError) {

        console.error(
            photoError
        );

        messagePrestation.textContent =
            "La photo a été envoyée mais n'a pas pu être enregistrée.";

        return;
    }
}


messagePrestation.textContent =
    "✓ Prestation enregistrée.";

formulaire.hidden = true;

await chargerPrestations();
}
/* ========================= VISIBILITE ========================= */
async function changerVisibilite(id) {
const { data, error } =
    await supabaseClient
        .from("prestations")
        .select("actif")
        .eq("id", id)
        .single();

if (error) {

    alert(
        "Impossible de modifier la visibilité."
    );

    return;
}

const { error: updateError } =
    await supabaseClient
        .from("prestations")
        .update({
            actif: !data.actif
        })
        .eq("id", id);

if (updateError) {

    alert(
        "Impossible de modifier la visibilité."
    );

    return;
}

await chargerPrestations();
}
/* ========================= SUPPRIMER ========================= */
async function supprimerPrestation(id) {
if (
    !confirm(
        "Supprimer définitivement cette prestation ?"
    )
) {
    return;
}

const { error } =
    await supabaseClient
        .from("prestations")
        .delete()
        .eq("id", id);

if (error) {

    console.error(error);

    alert(
        "Impossible de supprimer la prestation."
    );

    return;
}

await chargerPrestations();
}
/* ========================= DECONNEXION ========================= */
deconnexion.addEventListener( "click", async () => {
    await supabaseClient.auth.signOut();

    window.location.href =
        "admin-login.html";
}
);
/* ========================= ACTUALISER ========================= */
actualiserReservations.addEventListener( "click", chargerReservations );
/* ========================= SECURITE HTML ========================= */
function escapeHtml(value) {
return String(value)
    .
replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
/* ========================= DEMARRAGE ========================= */
async function demarrer() {
const user =
    await verifierConnexion();

if (!user) {
    return;
}

await chargerReservations();

await chargerPrestations();
}
demarrer();
