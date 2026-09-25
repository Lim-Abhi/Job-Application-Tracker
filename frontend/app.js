const API_URL = "http://localhost:5000/api/applications";

const form = document.getElementById("applicationForm");
const applicationsContainer =
    document.getElementById("applications");


/*
    Load applications
*/
async function loadApplications() {

    try {

        const response = await fetch(API_URL);

        const applications = await response.json();

        applicationsContainer.innerHTML = "";

        if (applications.length === 0) {

            applicationsContainer.innerHTML =
                "<p>No applications found.</p>";

            return;
        }

        applications.forEach(application => {

            const div = document.createElement("div");

            div.className = "application";

            div.innerHTML = `
                <h3>${application.company}</h3>

                <p>
                    <strong>Position:</strong>
                    ${application.position}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${application.location || "Not specified"}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${application.application_date.split("T")[0]}
                </p>

                <span class="status">
                    ${application.status}
                </span>

                <p>
                    <strong>Notes:</strong>
                    ${application.notes || "No notes"}
                </p>

                <button
                    class="delete-btn"
                    onclick="deleteApplication(${application.id})">
                    Delete
                </button>
            `;

            applicationsContainer.appendChild(div);
        });

    } catch (error) {

        console.error(error);

        applicationsContainer.innerHTML =
            "<p>Failed to load applications.</p>";
    }
}


/*
    Add application
*/
form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const application = {

        company:
            document.getElementById("company").value,

        position:
            document.getElementById("position").value,

        location:
            document.getElementById("location").value,

        status:
            document.getElementById("status").value,

        application_date:
            document.getElementById("application_date").value,

        notes:
            document.getElementById("notes").value
    };


    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(application)
        });


        if (!response.ok) {

            const error = await response.json();

            alert(error.message);

            return;
        }


        form.reset();

        await loadApplications();

    } catch (error) {

        console.error(error);

        alert("Failed to create application.");
    }
});


/*
    Delete application
*/
async function deleteApplication(id) {

    if (!confirm("Delete this application?")) {
        return;
    }


    try {

        const response =
            await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });


        if (!response.ok) {

            alert("Failed to delete application.");

            return;
        }


        await loadApplications();

    } catch (error) {

        console.error(error);

        alert("Failed to delete application.");
    }
}


/*
    Initial load
*/
loadApplications();
