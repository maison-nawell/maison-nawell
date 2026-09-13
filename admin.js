const reservationsTable = document.getElementById("reservations");
const nombreReservations = document.getElementById("nombre-reservations");
const nombrePrestations = document.getElementById("nombre-prestations");
const adminEmail = document.getElementById("admin-email");
const deconnexion = document.getElementById("deconnexion");
const actualiser = document.getElementById("actualiser-reservations");
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

adminEmail.textContent =
    user.email;

return user;
}
async function chargerPrestations() {
const { data, error } =
    await supabaseClient
        .from("prestations")
        .select("id")
        .eq("actif", true);

if (error) {

    console.error(
        "Erreur prestations :",
        error
    );

    nombrePrestations.textContent =
        "—";

    return;
}

nombrePrestations.textContent =
    data.length;
}
async function chargerReservations() {
reservationsTable.innerHTML = `
    <tr>
        <td colspan="7">
            Chargement...
        </td>
    </tr>
`;

const {
    data,
    error
} = await supabaseClient
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

    console.error(
        "Erreur réservations :",
        error
    );

    reservationsTable.innerHTML = `
        <tr>
            <td colspan="7">
                Impossible de charger les réservations.
            </td>
        </tr>
    `;

    return;
}

nombreReservations.textContent =
    data.length;

if (data.length === 0) {

    reservationsTable.innerHTML = `
        <tr>
            <td colspan="7">
                Aucune réservation pour le moment.
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
            reservation.date_rdv + "T00:00:00"
        );

    const dateFormatee =
        date.toLocaleDateString(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
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
            ${reservation.nom}
        </td>

        <td>
            ${reservation.telephone}
        </td>

        <td>
            ${
                reservation.prestations
                    ? reservation.prestations.nom
                    : "—"
            }
        </td>

        <td>
            <span class="statut">
                ${reservation.statut}
            </span>
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
                    : "—"
            }
        </td>
    `;

    reservationsTable.appendChild(
        ligne
    );
});

document
    .querySelectorAll(".btn-annuler")
    .forEach((bouton) => {

        bouton.addEventListener(
            "click",
            () => annulerReservation(
                bouton.dataset.id
            )
        );

    });
}
async function annulerReservation(id) {
const confirmation =
    window.confirm(
        "Voulez-vous vraiment annuler ce rendez-vous ?"
    );

if (!confirmation) {
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

    console.error(
        "Erreur annulation :",
        error
    );

    alert(
        "Impossible d'annuler ce rendez-vous."
    );

    return;
}

await chargerReservations();
}
deconnexion.addEventListener( "click", async () => {
    await supabaseClient.auth.signOut({
        scope: "local"
    });

    window.location.href =
        "admin-login.html";
}
);
actualiser.addEventListener( "click", chargerReservations );
async function demarrer() {
const user =
    await verifierConnexion();

if (!user) {
    return;
}

await chargerPrestations();

await chargerReservations();
}
demarrer();