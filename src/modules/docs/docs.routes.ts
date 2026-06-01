import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { readOpenApiDocument, readOpenApiYaml } from "./openapi";

export function createDocsRouter(): Router {
  const router = Router();
  const openApiDocument = readOpenApiDocument();

  router.get("/openapi.yaml", (_req, res) => {
    res.type("text/yaml").send(readOpenApiYaml());
  });

  router.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "Keeply API Docs",
      swaggerOptions: {
        persistAuthorization: true
      }
    })
  );

  return router;
}
