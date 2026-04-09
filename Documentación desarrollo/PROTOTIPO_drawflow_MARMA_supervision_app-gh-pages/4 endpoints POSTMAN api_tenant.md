
// 3 endpoints gestión desde POSTMAN api/tenant via api inicialmente
// luego desde index.html dashboard

----------------------------------------------------

1. Crear usuario: 
router.post("/auth/google-signin", authController.googleSignIn)
POST https://www.refactorii.com/api/tenant/auth/google-signin
Headers:  
	Content-Type : application/json
Body > raw > json
	{
	  "FullName": "Juan Pérez",
	  "GivenName": "Juan",
	  "FamilyName": "Pérez",
	  "ImageURL": "https://lh3.googleusercontent.com/a/AATXAJz0_example_image_url",
	  "Email": "juan.perez@example.com"
	}

----------------------------------------------------

2. Usuario crea companie y devuelve companyId para poder relacionar su usuario y rol con la empresa creada por el:
router.post('/companies', createCompany);
POST https://www.refactorii.com/api/tenant/companies 
Headers:
  x-user-email: usuario@ejemplo.com
Body:
	{
	  "name": "Mi Empresa S.A.",
	  "subdomain": "empresa2",
	  "description": "Descripción de la empresa"
	}

----------------------------------------------------

3. Usuario se relaciona con empresa
router.post('/companies/relate-user', relateUserToCompany );
POST https://www.refactorii.com/api/tenant/companies/relate-user
Headers:
  x-user-email: usuario@ejemplo.com
Body (JSON):
{
  "companyId": "ID_DE_LA_COMPANIA",
  "role": "admin" // opcional, por defecto es "viewer"
}

----------------------------------------------------

// 1 endpoint gestión endpoint desde FRONT formulario.html supervisores api/tenant via api 

4. Usuario ve sus empresas relacionadas:
router.get('/companies', getCompanies);
GET https://www.refactorii.com/api/tenant/companies
Headers:
  x-user-email: usuario@ejemplo.com

