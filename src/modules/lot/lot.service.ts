import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class LotService {
  constructor(
    @InjectConnection('mysqlConnection')
    private readonly connection: Connection,
    private readonly redisService: RedisService,
  ) { }

  async getLots(startDate: string): Promise<any[]> {
    const cacheKey = `lot:${startDate}`;
    const redisClient = this.redisService

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const query = `
      SELECT DISTINCT
           V.lote_cod_lote,
           PL.nombre_comercial AS PLANTA_INGRESO,
           PL_D.nombre_comercial AS PLANTA_DESTINO,
           PD.codigo_despacho AS CODIGO_LOT,
           DATE(V.lote_pesoinicial_fechahoraregistro) AS FECHA_INGRESOBALANZA,
           TC.descripcion AS TIPO_CARGA,
           CL.cod_cliente AS COD_PROVEEDOR,
           CL.documento AS PROVEEDORMINERO_RUC,
           UPPER(CL.razon_social) AS PROVEEDORMINERO_RAZONSOCIAL,
           TM.descripcion AS TIPO_MATERIAL,
           V.lote_peso_inicial AS lote_peso_bruto,
           V.lote_peso_final AS lote_peso_tara,
           V.lote_peso_neto,
           V.operaciones_humedad,
           V.lote_peso_seco,
           IFNULL(PD.codigo_planta, '') AS CODIGO_PLANTA,
           V.guiaremitente_serie,
           V.guiaremitente_numero,
           V.guiatransportista_serie,
           V.guiatransportista_numero
      FROM despachos_primertramo_validaciondatos V
             LEFT JOIN transporte T ON V.balanza_placa = T.cplaca
             INNER JOIN tb_clientes CL_T ON T.id_Transportista = CL_T.Id
             INNER JOIN tbconfig_tipovehiculo TV ON T.id_tipovehiculo = TV.Id
             INNER JOIN tbconfig_conductores CD ON V.guias_idchofer = CD.Id
             LEFT JOIN tbconfig_zonaorigen ZO ON V.lote_id_zonaorigen = ZO.Id
             LEFT JOIN tb_clientes CL ON V.lote_id_proveedorminero = CL.Id
             LEFT JOIN tbconfig_proveedoresmineros_concesion CCS ON V.lote_id_proveedorminero_concesion = CCS.Id
             LEFT JOIN tbconfig_encargadosmuestra EM ON V.lote_id_encargadomuestra = EM.Id
             LEFT JOIN tbconfig_tipomineral TM ON V.lote_id_tipomineral = TM.Id
             LEFT JOIN tbconfig_tipocarga TC ON V.lote_id_tipocarga = TC.Id
             LEFT JOIN tbconfig_producto P ON V.lote_id_producto = P.Id
             LEFT JOIN consolidado_lotes_cierrecontable CRL ON V.Id = CRL.id_registro
               AND CRL.id_tipoingreso = 1
             INNER JOIN catalogolotes LT ON V.lote_cod_lote = LT.ccod_Lote
             LEFT JOIN tbconfig_plantas PL ON LT.balanza_id_planta = PL.Id
             LEFT JOIN tbconfig_plantas PL_D ON V.despacho_id_destinoplanta = PL_D.Id
             LEFT JOIN despachos_segundotramo_programacion_detalle PD ON V.lote_cod_lote = PD.cod_lote
      WHERE V.guiaremitente_serie IS NOT NULL
        AND DATE(V.lote_pesoinicial_fechahoraregistro) >= ?
    `;

    const result = await this.connection.query(query, [startDate]);

    await redisClient.set(cacheKey, JSON.stringify(result), 3600);

    return result;
  }
}

// import { Injectable } from '@nestjs/common';
// import { InjectConnection } from '@nestjs/typeorm';
// import { Connection } from 'typeorm';
// import { RedisService } from '../../infrastructure/redis/redis.service';

// @Injectable()
// export class LotService {
//   constructor(
//     @InjectConnection('mysqlConnection')
//     private readonly connection: Connection,
//     private readonly redisService: RedisService,
//   ) { }

//   async getLots(startDate: string): Promise<any[]> {
//     const cacheKey = `lot:${startDate}`;

//     const cachedData = await this.redisService.get(cacheKey);
//     if (cachedData) {
//       return JSON.parse(cachedData);
//     }

//     const result = await this.connection.query('CALL sp_get_changes(?)', [startDate]);

//     await this.redisService.set(cacheKey, JSON.stringify(result), 3600);

//     return result;
//   }
// }
