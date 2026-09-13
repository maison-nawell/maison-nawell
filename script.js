document.addEventListener("DOMContentLoaded", () => {
const prestation = document.getElementById("prestation");
const dateRdv = document.getElementById("date-rdv");
const nomRdv = document.getElementById("nom-rdv");
const telephoneRdv = document.getElementById("telephone-rdv");
const creneaux = document.getElementById("creneaux");

const recap = document.getElementById("recap-rdv");
const recapPrestation = document.getElementById("recap-prestation");
const recapDate = document.getElementById("recap-date");
const recapHeure = document.getElementById("recap-heure");

const confirmer = document.getElementById("confirmer-rdv");
const messageRdv = document.getElementById("message-rdv");

let heureSelectionnee = null;

const aujourdHui = new Date();

const annee = aujourdHui.getFullYear();
const mois = String(aujourdHui.getMonth() + 1).padStart(2, "0");
const jour = String(aujourdHui.getDate()).padStart(2, "0");

dateRdv.min = `${annee}-${mois}-${jour}`;

async function afficherCreneaux() {

    heureSelectionnee = null;
    recap.classList.remove("active");
    messageRdv.textContent = "";

    if (!prestation.value || !dateRdv.value) {

        creneaux.innerHTML = `
            <tr>
                <td colspan="4">
                    Choisissez une prestation et une date.
                </td>
            </tr>
        `;

        return;
    }

    creneaux.innerHTML = `
        <tr>
            <td colspan="4">
                Chargement des créneaux...
            </td>
        </tr>
    `;

    try {

        if (
            typeof supabaseClient === "undefined" ||
            !supabaseClient
        ) {
            throw new Error(
                "Supabase n'est pas chargé."
            );
        }

        const { data, error } =
            await supabaseClient.rpc(
                "get_available_slots",
                {
                    p_date: dateRdv.value,
                    p_prestation_id:
                        Number(prestation.value)
                }
            );

        if (error) {
            throw error;
        }

        creneaux.innerHTML = "";

        if (!data || data.length === 0) {

            const date =
                new Date(
                    dateRdv.value + "T00:00:00"
                );

            if (date.getDay() === 0) {

                creneaux.innerHTML = `
                    <tr>
                        <td colspan="4">
                            Le salon est fermé le dimanche.
                        </td>
                    </tr>
                `;

            } else {

                creneaux.innerHTML = `
                    <tr>
                        <td colspan="4">
                            Aucun créneau disponible pour cette date.
                        </td>
                    </tr>
                `;
            }

            return;
        }

        data.forEach((slot) => {

            const ligne =
                document.createElement("tr");

            const heureDebut =
                String(slot.heure_debut)
                    .slice(0, 5);

            const heureFin =
                String(slot.heure_fin)
                    .slice(0, 5);

            const disponible =
                slot.disponible === true;

            ligne.innerHTML = `
                <td>${heureDebut}</td>

                <td>${heureFin}</td>

                <td class="${
                    disponible
                        ? "disponible"
                        : "indisponible"
                }">
                    ${
                        disponible
                            ? "✓ Disponible"
                            : "✕ Indisponible"
                    }
                </td>

                <td>
                    <button
                        type="button"
                        class="btn-reserver"
                        ${
                            disponible
                                ? ""
                                : "disabled"
                        }
                    >
                        ${
                            disponible
                                ? "Réserver"
                                : "Indisponible"
                        }
                    </button>
                </td>
            `;

            if (disponible) {

                const bouton =
                    ligne.querySelector(
                        ".btn-reserver"
                    );

                bouton.addEventListener(
                    "click",
                    () => {

                        selectionnerCreneau(
                            slot.heure_debut,
                            slot.heure_fin
                        );

                    }
                );
            }

            creneaux.appendChild(ligne);
        });

    } catch (error) { console.error("ERREUR SUPABASE COMPLETE :", error);
creneaux.innerHTML = `
    <tr>
        <td colspan="4">
            ${error.message || "Erreur inconnue"}
            <br>
            Code : ${error.code || "inconnu"}
            <br>
            ${error.hint || ""}
        </td>
    </tr>
`;
}}

function selectionnerCreneau(
    heureDebut,
    heureFin
) {

    heureSelectionnee = heureDebut;

    const option =
        prestation.options[
            prestation.selectedIndex
        ];

    recapPrestation.textContent =
        option.textContent.trim();

    const date =
        new Date(
            dateRdv.value + "T00:00:00"
        );

    recapDate.textContent =
        date.toLocaleDateString(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    recapHeure.textContent =
        `${String(heureDebut).slice(0, 5)} - ${
            String(heureFin).slice(0, 5)
        }`;

    recap.classList.add("active");

    recap.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

confirmer.addEventListener(
    "click",
    async () => {

        messageRdv.textContent = "";

        if (!nomRdv.value.trim()) {

            messageRdv.textContent =
                "Veuillez renseigner votre nom.";

            nomRdv.focus();

            return;
        }

        if (!telephoneRdv.value.trim()) {

            messageRdv.textContent =
                "Veuillez renseigner votre téléphone.";

            telephoneRdv.focus();

            return;
        }

        if (!prestation.value) {

            messageRdv.textContent =
                "Veuillez choisir une prestation.";

            return;
        }

        if (!dateRdv.value) {

            messageRdv.textContent =
                "Veuillez choisir une date.";

            return;
        }

        if (!heureSelectionnee) {

            messageRdv.textContent =
                "Veuillez choisir un créneau.";

            return;
        }

        confirmer.disabled = true;

        confirmer.textContent =
            "RÉSERVATION EN COURS...";

        try {

            const { error } =
                await supabaseClient.rpc(
                    "book_appointment",
                    {
                        p_nom:
                            nomRdv.value.trim(),

                        p_telephone:
                            telephoneRdv.value.trim(),

                        p_prestation_id:
                            Number(prestation.value),

                        p_date:
                            dateRdv.value,

                        p_heure_debut:
                            heureSelectionnee,

                        p_commentaire:
                            null
                    }
                );

            if (error) {
                throw error;
            }

            messageRdv.textContent =
                "✓ Votre demande de rendez-vous a bien été enregistrée !";

            confirmer.textContent =
                "RÉSERVATION CONFIRMÉE";

            heureSelectionnee = null;

            await afficherCreneaux();

            confirmer.disabled = true;

        } catch (error) {

            console.error(
                "ERREUR RESERVATION :",
                error
            );

            messageRdv.textContent =
                error.message ||
                "Impossible de réserver ce créneau.";

            confirmer.disabled = false;

            confirmer.textContent =
                "CONFIRMER LE RENDEZ-VOUS";

        }

    }
);

prestation.addEventListener(
    "change",
    afficherCreneaux
);

dateRdv.addEventListener(
    "change",
    afficherCreneaux
);
});